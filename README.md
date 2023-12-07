# Microblab

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

Check in browser on [http://localhost:5000/](http://localhost:5000/)

Check in browser for swagger-api on [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/)

### BI Dashboard

![BI-dashboard](https://github.com/krushikagujarati/Twitter/assets/48424819/79d277d6-9825-4a85-8fe7-7d4733579101)

### You can take a pull of the docker image using the command below

```
docker pull jsalammagari/microblabbing
```

### Live url

https://microblab.onrender.com/

