import React from "react";
import Button from "./Components/button/button.tsx";
import Header from "./Components/header/header.tsx";
export default class App extends React.Component {
    componentDidMount(): void {

    }
    render(): React.ReactNode {
        return <div>
            <Button label="some"/>
            <Header/>
        </div>
        
    }
}
