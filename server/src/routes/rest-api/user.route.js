// controllers
import {
    UserCtrl
} from "../../controllers"

const Router = require("express").Router();

Router.post("/forgot-password", UserCtrl.handleForgotPassword);
Router.post("/reset-password", UserCtrl.handleResetPassword);

export default Router;