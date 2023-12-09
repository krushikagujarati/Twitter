# Microblab

### Report

https://docs.google.com/document/d/1DYC9KU1Jm66KITj3A2HePqBGMo_o-PXx/edit?usp=drive_link&ouid=103705650152882518070&rtpof=true&sd=true

### Scaling Plan

https://docs.google.com/document/d/1jb4qpKh-RfzZ8_IaBwjfIj2nHGyFSEhb/edit?usp=sharing&ouid=103705650152882518070&rtpof=true&sd=true


### Env variables

Rename the .env.example file to .env in both root folder and client folder and add the following

In root folder
```
mongoURI=<mongoURI>
jwtSecret=my-secret
githubToken=<githubToken>
GoogleClientId=<GoogleClientId>
GoogleClientSecret=<GoogleClientSecret>
TwitterconsumerKey=<TwitterconsumerKey>
TwitterconsumerSecret=<TwitterconsumerSecret>
GitHubclientID=<GitHubclientID>
GitHubclientSecret=<GitHubclientSecret>
UIUrl=http://localhost:3000
ServerUrl=http://localhost:5000
NODE_ENV=development
```

In client folder
```
REACT_APP_SERVER_URL = 'http://localhost:5000'
```

### Install server dependencies

```bash
npm install
```

### Install client dependencies

```bash
cd client
npm install
```

### Run both Express & React from root

```bash
npm run dev
```

Check in browser on [http://localhost:3000/](http://localhost:3000/)

Check in browser for swagger-api on [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/)

### BI Dashboard

![BI-dashboard](https://github.com/krushikagujarati/Twitter/assets/48424819/79d277d6-9825-4a85-8fe7-7d4733579101)

### You can take a pull of the docker image using the command below

```
docker pull jsalammagari/microblabbing
```

### You can run the docker image using the below command

```
docker run -p 5000:5000 -p 3000:3000 jsalammagari/microblabbing
```

### Live url

https://microblab.onrender.com/

### Swagger

https://microblab.onrender.com/api-docs/
