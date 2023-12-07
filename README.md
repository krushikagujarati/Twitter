# Microblab

### Env variables

Rename the .env.example file to .env in both main folder and client folder and add the following

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
RedisPW=<RedisPW>
NODE_ENV=development
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

### BI Dashboard

![BI-dashboard](https://github.com/krushikagujarati/Twitter/assets/48424819/79d277d6-9825-4a85-8fe7-7d4733579101)

### Live url

https://microblab.onrender.com/

