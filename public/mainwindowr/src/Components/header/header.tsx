import './header.scss'

export default function Header() {
    return <header>
        <img id="logo" src="../icon.ico"/>
        <div id="maintext"></div>
        <div id="header_btns">
            <div className="header_btn" id="minimize">
                <img className="header_btn_ico" src="../images/collapse.png" alt=""/>
            </div>
            <div className="header_btn" id="close">
                <img className="header_btn_ico" src="../images/close.png" alt=""/>
            </div>
        </div>
    </header>
}
    