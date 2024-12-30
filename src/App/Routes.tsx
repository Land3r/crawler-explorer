import { Route } from "react-router";
import { Home } from '../pages/Home'
import { Routes as ReactRoutes } from 'react-router'

const Routes = () => {
    return (
        <ReactRoutes>
            <Route path="/" Component={Home}></Route>
        </ReactRoutes>
    )
}

export default Routes;