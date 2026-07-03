import { useState } from "react";

import AuthCard from "../components/auth/AuthCard";
import LoginForm from "../components/auth/LoginForm";
import ForgotPasswordForm from "../components/auth/ForgotPassword";
import RegisterForm from "../components/auth/RegisterForm";

function Login() {

    const [screen, setScreen] = useState("login");

    return (
        <div className="flex items-center justify-center h-[calc(100vh-4rem)] overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/images/background-banner.png')" }}>

            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-blue-950/55 to-slate-900/45 backdrop-blur-[1px]"
            ></div>

            <div className="z-50">
                <AuthCard
                    title={screen === "login" ? "Welcome Back" : screen === "forgot" ? "Forgot Password" : "Create Account"}
                    subtitle={screen === "login" ? "Login to continue" : screen === "forgot" ? "Enter your email to receive OTP." : "Fill the details below."}
                >

                    {screen === "login" && (
                        <LoginForm onForgotPassword={() => setScreen("forgot")} onRegister={() => setScreen("register")} />
                    )}

                    {screen === "forgot" && (
                        <ForgotPasswordForm onBack={() => setScreen("login")} />
                    )}

                    {screen === "register" && (
                        <RegisterForm onLogin={() => setScreen("login")} />
                    )}

                </AuthCard>
            </div>

        </div>
    );

}

export default Login;