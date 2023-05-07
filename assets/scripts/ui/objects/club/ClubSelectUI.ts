import { CreateClubUI } from './CreateClubUI';
import { UIManager } from './../../../../framework/Manager/UIManager';
import { GameDataManager } from './../../../../framework/Manager/GameDataManager';
import { AudioManager } from './../../../../framework/Manager/AudioManager';
import { LogWrap } from './../../../../framework/Utils/LogWrap';
import { BaseUI } from "../../../../framework/UI/BaseUI";
import * as GameConstValue from "../../../data/GameConstValue";
import { CLUB_POWER } from '../../../data/club/ClubData';

const { ccclass, property } = cc._decorator;

@ccclass
export class ClubSelectUI extends BaseUI {

    protected static className = "ClubSelectUI";
    public static getUrl(): string {
        LogWrap.info(this.className);
        return GameConstValue.ConstValue.UI_CLUB_DIR + this.className;
    }
    
    @property(cc.Prefab)
    clubItem: cc.Prefab = null;
    @property(cc.Node)
    nodeContent: cc.Node = null;
    @property(cc.Node)
    create_btn:cc.Node = null

    private clubItemList = [];
    private openType = 0

    onLoad()
    {

    }

    start()
    {
        // var clubData = GameDataManager.getInstance().clubData
        // if(clubData.clubType == CLUB_POWER.CRT_BOSS)
        // {
        //     this.create_btn.active = true
        // }
    }

    public setOpenType(type)
    {
        this.openType = type
        // this.node.getChildByName("btn_create").active = type == 0
        this.node.getChildByName("btn_join_club").active = type == 0
    }

    private updateClubList() {

        //清空原始数据
        this.clubItemList = [];
        this.nodeContent.removeAllChildren()
        var clubData = GameDataManager.getInstance().clubData
        if (clubData==null || clubData.allMyClubList.length == 0){
            return
        }
        //改变大小
        this.nodeContent.width = clubData.allMyClubList.length * this.clubItem.data.width;
        var count = 0
        if (this.nodeContent.width < 1120)
            this.nodeContent.width = 1120;

        for (var index = 0; index < clubData.allMyClubList.length; ++index) {
            if (this.openType == clubData.clubType)
            {
                let item = cc.instantiate(this.clubItem);
                this.nodeContent.addChild(item);
                item.setPosition(this.clubItem.data.width * (0.5 + count), 0);
                item.getComponent('ClubSelectItem').initView(count, clubData.allMyClubList[index].cid, clubData.allMyClubList[index].name, clubData.clubType)
                this.clubItemList.push(item);
                count++
            }
           
        }
   }


    private button_create() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().openUI(CreateClubUI, 2, () => {
            UIManager.getInstance().getUI(CreateClubUI).getComponent("CreateClubUI").initView("create");
        });
    }

    private button_join() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().openUI(CreateClubUI, 2, () => {
            UIManager.getInstance().getUI(CreateClubUI).getComponent("CreateClubUI").initView("join");
        });
    }

    private button_close() {
        AudioManager.getInstance().playSFX("button_click"); 
        UIManager.getInstance().closeUI(ClubSelectUI);
    }
}
