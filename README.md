# PolygongeoUi

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.2.

## Development server

Run `nx serve projects` or `nx serve admin` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build dev mode

Run `nx build projects` or `nx build admin` to build the project. The build artifacts will be stored in the `dist/` directory.

## Build production mode

Run `nx build projects --prod --base-href='/projects/'` to build the project for production mode. The build artifacts will be stored in the `dist/` directory.

## Deploy in Production

    * Build in production mode.
    * Login in AWS with devops polygongeo email account
    * After successful login, Change the region to Hyderabad(ap-south-2) at the top right.
    * Navigate to S3 to the polygon-geo bucket(`https://ap-south-2.console.aws.amazon.com/s3/buckets/polygon-geo?region=ap-south-2`)
    * Go to the UI folder and delete the dist folder.
    * Upload the locally build prod dist folder to AWS.
    * Make sure your ip address is added to the inbound rules of this security group (`https://ap-south-2.console.aws.amazon.com/ec2/home?region=ap-south-2#SecurityGroup:group-id=sg-021921c533e765e75`)
    * SSH to the EC2 instance through this `ssh -i "polygon-geo-server.pem" ec2-user@ec2-18-61-131-38.ap-south-2.compute.amazonaws.com`
    * Navigate to polygon-geo directory -> `cd polygon-geo`
    * Copy the s3 code to instance and restart the server with this command `sh deploy.sh ui`
    * Once the deployment is done, hard reload(CTRL+SHIFT+R) the website (http://18.61.131.38/projects/#/dashboard). You should see the changes reflect on the site
    
Initial frontend setup