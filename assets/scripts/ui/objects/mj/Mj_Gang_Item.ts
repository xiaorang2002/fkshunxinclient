import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { GameUI_MJ } from './GameUI_MJ';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { AudioManager } from "../../../../framework/Manager/AudioManager";

const { ccclass, property } = cc._decorator;

@ccclass
export class Mj_Gang_Item extends cc.Component {


    private index = 0
    private gangTile = 0
    private gangAciton = 0
    private laiziNum = 0

    public setInfo(idx, data) {
        this.index = idx
        this.gangTile = data[1]
        this.gangAciton = data[0]
        this.laiziNum = 0
        var mjData = GameDataManager.getInstance().getDataByCurGameType();
        for (var i = 0; i < 4; i++) {
            var tagetNode = this.node.getChildByName("mj" + i)
            this.setMjTextureNewLogic(tagetNode, "mj_pg_2", true);
            this.setMjTextureNewLogic(tagetNode.getChildByName("sp"), "mj_" + data[i+1]);
            if (mjData && data[i+1] == mjData.laiziValue) {
                this.laiziNum++
            }
            tagetNode.scale = 0.8
        }
    }

    public setMjTextureNewLogic(loadnode, url, needStyle = false) {
        var sprite = loadnode.getComponent(cc.Sprite)
        if (url == null || url == "") {
            sprite.spriteFrame = null;
            return;
        }
        var spriteFrame = this.getSpriteFrameFromParent(url,needStyle)
        sprite.spriteFrame = spriteFrame;
    }

    // 从父节点保存的缓存纹理列表获取指定纹理
    public getSpriteFrameFromParent(url, needStyle){
        var style = cc.sys.localStorage.getItem("mjStyle")
        if (style && needStyle && style == "black")
            url += "_black"

        var gameUIMj = UIManager.getInstance().getUI(GameUI_MJ).getComponent("GameUI_MJ")
        return gameUIMj.getMjSpriteFrame(url)
    }

    button_click() {
        AudioManager.getInstance().playSFX("button_click")
        var gameUIMj = UIManager.getInstance().getUI(GameUI_MJ).getComponent("GameUI_MJ")
        gameUIMj.duo_gang_click(this.gangTile, this.gangAciton, this.laiziNum)
    }

}
