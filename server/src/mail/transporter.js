import nodemailer from "nodemailer";
import MAIL from "./config"
import { FORGOT_PASSWORD } from "./types"
import { geForgotPasswordOption } from "./options"


let transporter = nodemailer.createTransport({
    host: MAIL.HOST,
    port: MAIL.PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: MAIL.USERNAME, // generated ethereal user
        pass: MAIL.PASSWORD // generated ethereal password
    }
});

export default (type) => {
    return {
        sendMail: (data) => {
            switch (type) {
                case FORGOT_PASSWORD: return transporter.sendMail(geForgotPasswordOption(data))

                default: throw new Error(`We have not support ${type} mail form`)
            }
        }
    }
}

