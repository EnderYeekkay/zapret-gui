import '../../../../global/styles/style.css'
import './button.scss'

enum ButtonStyle {
    Primary = 'btn_primary',
    Secondary = 'btn_secondary',
    Danger = 'btn_danger',
    Success = 'btn_success',
    Link = 'btn_link',
}
type ButtonProps = {
    style?: ButtonStyle
    Icon?: {
        iconPath?: string
        iconSize?: ButtonIconSize
    }
    label: string
    toStop?: boolean
}
enum ButtonIconSize {
    i16 = 'btn_img16',
    i18 = 'btn_img18'
}
export default function Button ({
    style = ButtonStyle.Primary,
    Icon = {
        iconPath: undefined,
        iconSize: ButtonIconSize.i18,
    },
    label,
    toStop = false
}:ButtonProps) {
    let btn_classes = `btn ${style || ''}`
    return <button className={btn_classes}>
        <div className="btn_text">{label}</div>
    </button>
}