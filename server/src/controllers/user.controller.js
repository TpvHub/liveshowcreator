import transporter from "../mail/transporter"
import { FORGOT_PASSWORD } from "../mail/types"
import bcrypt from 'bcrypt'

import {
    jwtParse,
    jwtSign
} from "../utils/jwt"


const handleForgotPassword = async (req, res) => {
    const ctx = req.ctx;
    try {
        let user = await ctx.models.user.findOne({ email: req.body.email });
        if (user) {
            await transporter(FORGOT_PASSWORD).sendMail({
                name: user.firstName,
                email: user.email,
                token: jwtSign(Object.assign(user, { password: "hidden" }),
                    Math.floor(Date.now() / 1000) + (60 * 5) // expried in 5 min
                ),
                app_origin: req.body.app_origin,
            });

            res.status(200).json({
                success: true,
                message: "We have sent a link reset password to your email"
            });
        }
        else throw new Error("User not found!");
    } catch (er) {
        res.status(400).json({ success: false, error: er.message });
    }
}

const handleResetPassword = async (req, res) => {
    const ctx = req.ctx;

    const { new_password, confirm, jwt_token } = req.body;

    try {
        if (new_password !== confirm) throw new Error("Password not match");
        if (!jwt_token) throw new Error("Please provide jwt_token");

        const jwtParsed = jwtParse(jwt_token);
        if (jwtParsed.error) throw new Error(jwtParsed.error);
        else {
            let userData = jwtParsed.data;

            await ctx.models.user.updateAttribute(userData._id, {
                password: bcrypt.hashSync(new_password, 10)
            })

            res.status(200).json({
                success: true,
                message: "Update password successful"
            });
        }
    } catch (er) {
        res.status(400).json({ success: false, error: er.message });
    }
}

export default {
    handleForgotPassword,
    handleResetPassword
}