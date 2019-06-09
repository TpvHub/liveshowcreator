## Local Development

### Setup Mongodb 

https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/



## Custom ssh login on your Mac

```
sudo vi ~/.ssh/config 

```
Add custom ssh 

```
Host producer

  User root

  Port 22

```

## Build and Deploy code to server

### Step 1: Build Api

change production = true in ``` server/src/config.js```

```
cd server
npm run build

```


### Step 2: Build React Web
change production = true in ```web/src/config.js ```


```
cd web 

npm run build

npm run move
```


### Step 3 Deployment

```
cd server
npm run deploy
```

### Step 4 Login to TpvHub server and restart node app

```

```

