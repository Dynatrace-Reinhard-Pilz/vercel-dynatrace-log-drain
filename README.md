# Custom Vercel -> Dynatrace Log Drain

[Vercel](https://vercel.com) currently offers for Enterprise and Pro customers the ability to configure customizeable log drains in Beta.

As an alternative this solution allows you to configure a log drain via a custom [integration](https://vercel.com/integrations) - and route these logs to [Dynatrace](https://www.dynatrace.com) using the [Generic log ingestion API](https://www.dynatrace.com/support/help/observe-and-explore/logs/log-management-and-analytics/lma-log-ingestion-via-api).

## Prerequisites
In order for this custom integration to work a publicly reachable host with NodeJS needs to be available. The solution will run on either Windows or Linux. Installing Node varies dependin on the Linux distribution you're using. The integration doesn't utilize any special features - a fairly recent version of Node will be sufficient to run it. It has been tested against `v12.22.9`.

## Deployment
Once launched, this solution serves two purposes:
* It serves the necessary endpoints for Vercel to install a Custom Integration
* During the installation process it automatically installs a Log Drain
* It acts as the endpoint for the logs Vercel sends. Currently the solution just reroutes the data to Dynatrace, but it's also possible to modify the contents before that.
### Create a new Vercel integration
There is currently no official Integration from Dynatrace available within the marketplace. Therefore you will have to create a custom integration using the [integrations console](https://vercel.com/dashboard/integrations/console).
* For the mandatory Logo you may want to choose the [Dynatrace Logo](https://companieslogo.com/img/orig/DT-89e31c0c.png)
* For the mandatory `Feature Media` images you need to make sure that you have an image with the correct aspect ratio available
* For the `Redirect URL` you need to specify `http://###.###.###.###:3030/install`, where the IP Address / Host name is the IP Address or DNS of a publicly available host that will be running this solution. If you've changed port `3030` within `integration.js`, specify that port here.
* For `Configuration URL` you can specify `http://###.###.###.###:3030/configure`. It's currently not being used, though.
* There are a few remaining mandatory fields (email address, description, ...). You may choose the contents of them freely.
* Once the Integration has been created, check out its details once again. You'll find an OAuth ClientID and ClientSecret that will be required in the next steps
### Clone and Configure
* Clone the repository: `git clone https://github.com/Dynatrace-Reinhard-Pilz/vercel-dynatrace-log-drain.git`
* Edit `integration.js` to customize configuration:
* `const INTEGRATION_PUBLIC_IP = "###.###.###.###"` specifies the public IP address of the host this solution is deployed to. 
* `const INTEGRATION_BIND_PORT = 3030` specifies the port this solution will bind to. Changing the port is optional.
* `const INTEGRATION_BIND_ADDRESS = "0.0.0.0"` specifies the bind address the solution will bind to. By default the solution is available for everyone to connect.
### Launch Integration Server
* `export DYNATRACE_ENVIRONMENT_ID=########` configures the Dynatrace environment the logs will get sent to. If you're accessing your Dynatrace environment using the URL `https://abc12345.live.dynatrace.com`, then the environment ID is `abc12345`.
* `export DYNATRACE_API_TOKEN=dt0c01.########################.################################################################` configures an API Token for your Dynatrace environment, that allows for ingesting logs. The specific permission is called `Ingest logs (logs.ingest)`. For further details about how to create such an API Token visit [Tokens and authenticaion](https://www.dynatrace.com/support/help/dynatrace-api/basics/dynatrace-api-authentication) within the Dynatrace Documentation.
* `export VERCEL_CLIENT_ID=############################` configures the oAuth Client ID for the custom Vercel Integration you've created before. To obtain its value, edit your integration and scroll to be end of the page. You will find a section `Access Details` here.
* `export VERCEL_CLIENT_SECRET=########################` configures the oAuth Client Secret for the custom Vercel Integration you've created before. To obtain its value, edit your integration and scroll to be end of the page. You will find a section `Access Details` here.
* Finally launch the solution: `node integration.js`.
### Add Integration to Project(s)
* In your Vercel Dashboard navigate to "Integrations"
* Because this is a custom integration, you won't find it in the Marketplace
* Instead, navigate to the [integrations console](https://vercel.com/dashboard/integrations/console) and edit your Integration.
* Click on the button `View in Marketplace` in the upper right corner
* Now, by clicking on `Add Integration`, you will be able to add this integration to either all your Vercel Projects or specific Projects.
### Check the incoming logs in Dynatrace
You have arrived! At https://#######.live.dynatrace.com/ui/log-monitoring you will find the logs Vercel produced for Dynatrace.

## Planned Improvements
* It's currently not possible for Dynatrace to consume logs from Vercel directly. We're working on solving this problem. In this case you would just have to launch this solution while adding the Integration to your Projects. Later on - because it doesn't have to act as a middle man - it can get shut down.