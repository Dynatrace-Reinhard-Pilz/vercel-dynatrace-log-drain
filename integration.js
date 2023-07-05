const http = require("http");
const https = require("https");
const querystring = require('querystring');

const INTEGRATION_BIND_PORT = 3030
const INTEGRATION_BIND_ADDRESS = "0.0.0.0"
const INTEGRATION_PUBLIC_IP = "###.###.###.###"

const DYNATRACE_ENVIRONMENT_ID = process.env.DYNATRACE_ENVIRONMENT_ID
const DYNATRACE_API_TOKEN = process.env.DYNATRACE_API_TOKEN
const VERCEL_CLIENT_ID = process.env.VERCEL_CLIENT_ID
const VERCEL_CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET

function handleCreateDrainResponse(res, res0, next) {
    var result = ""
    res.on('data', function (chunk) {
        result += chunk;
    });
    res.on('end', function () {        
        res0.setHeader("Location", next)        
        res0.writeHead(301);
        res0.end(result);
    });
    res.on('error', function (err) {
        res0.writeHead(200);
        res0.end(err);
    });    
}

function handleTokenResponse(res, res0, teamId, next) {
    var result = '';
    res.on('data', function (chunk) {
        result += chunk;
    });
    res.on('end', function () {
        var tokenResponse = JSON.parse(result)
        var post_data = JSON.stringify(
            {
                "deliveryFormat": "json",
                "sources": ["static", "lambda", "build", "edge", "external"],
                "url": `http://${INTEGRATION_PUBLIC_IP}:${INTEGRATION_BIND_PORT}/api/v2/logs/ingest`,
                "name": "dynatrace",
                "headers": {
                    "Authorization": `Api-Token ${DYNATRACE_API_TOKEN}`,
                    "Content-Type": "application/json; charset=utf-8",
                }
            }
        );        
        var post_req = https.request({
            host: 'api.vercel.com',
            port: '443',
            path: (teamId === undefined) ? `/v2/integrations/log-drains` : `/v2/integrations/log-drains?teamId=${teamId}`,
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${tokenResponse.access_token}`,
                "Content-Type": 'application/json',
                'Content-Length': Buffer.byteLength(post_data)
            }
        }, function (res) {
            handleCreateDrainResponse(res, res0, next)
        });
        post_req.write(post_data);
        post_req.end();
    });
    res.on('error', function (err) {
        res0.writeHead(200);
        res0.end(err);
    })
}

function handleInstall(req, res0) {
    var query = require('url').parse(req.url, true).query
    var code = query.code
    var teamId = query.teamId
    // var configurationId = query.configurationId
    // var source = query.source
    var next = query.next

    var post_data = querystring.stringify({
        "client_id": VERCEL_CLIENT_ID,
        "client_secret": VERCEL_CLIENT_SECRET,
        "code": code,
        "redirect_uri": `http://${INTEGRATION_PUBLIC_IP}:${INTEGRATION_BIND_PORT}/install`,
    });

    var post_req = https.request({
        host: 'api.vercel.com',
        port: '443',
        path: '/v2/oauth/access_token',
        method: 'POST',
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',
            "Content-Length": Buffer.byteLength(post_data)
        }
    }, function (res) {
        handleTokenResponse(res, res0, teamId, next)
    });
    post_req.write(post_data);
    post_req.end();
}

function handleLogs(req, res0) {
    var headers = req.headers
    delete headers['host']
    var logs_payload = '';
    req.on("data", (chunk) => {
        logs_payload += chunk
    });
    req.on("end", () => {    
        var post_req = https.request({
            host: DYNATRACE_ENVIRONMENT_ID + ".live.dynatrace.com",
            port: '443',
            path: '/api/v2/logs/ingest',
            method: 'POST',
            headers: headers,
        }, function (res) {
            var dynatrace_response = '';
            res.on('data', function (chunk) {
                dynatrace_response += chunk;
            })
            res.on('end', function () {
                res0.writeHead(res.statusCode);
                res0.end(dynatrace_response);
            })
            res.on('error', function (err) {
                res0.writeHead(res.statusCode);
                res0.end(err);
            })
        });
        post_req.write(logs_payload);
        post_req.end();        
    })
}

const requestListener = function (req, res0) {
    if (req.url.startsWith("/api/v2/logs/ingest")) {
        handleLogs(req, res0)
    } else if (req.url.startsWith("/install?")) {
        handleInstall(req, res0)
    } else {
        res0.writeHead(404);
        res0.end("404 not found " + req.url);
    }
};

const server = http.createServer(requestListener);
server.listen(INTEGRATION_BIND_PORT, INTEGRATION_BIND_ADDRESS, () => {
    console.log(`Server is running on http://${INTEGRATION_BIND_ADDRESS}:${INTEGRATION_BIND_PORT}`);
});
