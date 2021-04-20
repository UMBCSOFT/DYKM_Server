# DYNM_Server



# Running
1. Run `npm install` to get all the node module dependencies
2. Run `node index.js` to start the server
3. Go to `http://localhost:1337` on your browser to interact with the application using the test html page

# Configuring WebStorm
1. From the "Welcome to WebStorm page" select `Get from VSC`
2. Copy the git url `https://github.com/UMBCSOFT/DYNM_Server.git` into the URL slot
3. Click clone and login with github
4. Select the project to open it

Now we need to setup the run configuration
1. In the top right click Add Configuration
2. On the top left there will be a plus symbol. Click that.
3. In the drop down select `Node.js`
4. Be sure to include `index.js` in the `Node parameters` slot and optionally rename the configuration to whatever you want
5. Click apply

Now the project can be run by pressing Shift+f10 or by clicking the play button in the top right (or the bug next to it for attaching a debugger)

Once the app is running navigate to `http://localhost:1337/`. You can click the link in the run output box
