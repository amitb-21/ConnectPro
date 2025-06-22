import { use, useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const route = useNavigate();

        const isAuthenticated = () => {
            if (localStorage.getItem("token")) {
                return true;
            }
            return false;
        }

        useEffect(() => {
            if (!isAuthenticated()) {
                route("/auth");
            }
        }, []);

        return (
            <WrappedComponent {...props} />
        );
    }
    return AuthComponent;
}

export default withAuth;