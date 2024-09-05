const dotenv = require("dotenv").config();
const app = require("./app");

const port = process.env.PORT || 3000;
//connect to mongodb
const connectDb = require("./config/db");

//start the server
app.listen(port, () => {
  console.log(`Server running on port ${port} 🔥`);
  connectDb();
});
