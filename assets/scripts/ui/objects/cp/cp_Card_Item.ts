import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { GameUI_CP } from './GameUI_CP';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from "../../../../framework/Manager/AudioManager";
import { CP_ACTION} from './../../../data/GameConstValue';

const { ccclass, property } = cc._decorator;

@ccclass
export class cp_Card_Item extends cc.Component {

    private cpTitle = 0
    private cpOtherTitle = 0
    private cpAction = 0

    public setInfo(cpAction,cpTitle,cpOtherTitle = 0) {
        this.cpTitle = cpTitle
        this.cpOtherTitle = cpOtherTitle
        this.cpAction = cpAction
        let tagetNode = this.node.getChildByName("cp")
        let gameUICp = UIManager.getInstance().getUI(GameUI_CP).getComponent("GameUI_CP")
        if(cpAction == CP_ACTION.ACTION_CHI){
            tagetNode.getComponent(cc.Sprite).spriteFrame = gameUICp.getMjSpriteFrame("cptb" + cpOtherTitle)
        }else{
            tagetNode.getComponent(cc.Sprite).spriteFrame = gameUICp.getMjSpriteFrame("cptb" + cpTitle)
        }    
    }

    button_click() {
        AudioManager.getInstance().playSFX("button_click")
        var gameUICp = UIManager.getInstance().getUI(GameUI_CP).getComponent("GameUI_CP")
        gameUICp.duo_CBG_click(this.cpAction, this.cpTitle, this.cpOtherTitle)
    }

}
