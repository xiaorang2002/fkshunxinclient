import { WaitUI } from './../../scripts/ui/WaitUI';
import { BaseUI, UIClass } from "../UI/BaseUI";
import { LogWrap } from "../Utils/LogWrap";
import { Wait2UI } from '../../scripts/ui/Wait2UI';

export class UIManager {
    private static instance: UIManager;
    public uiList: BaseUI[] = [];
    private uiRoot: cc.Node = null;
    private preLoadDict = new Map();

    public static getInstance(): UIManager {
        if (this.instance == null) {
            this.instance = new UIManager();
        }
        return this.instance;
    }

    constructor() {
        this.uiRoot = cc.find("Canvas");
    }

    public openUI<T extends BaseUI>(uiClass: UIClass<T>, zOrder?: number, callback?: Function, onProgress?: Function, ...args: any[]) {
        if (this.getUI(uiClass)) {
            this.showUI(uiClass, callback);
            return;
        }
        if (this.preLoadDict.get(uiClass.getUrl()))
        {
            LogWrap.log("find preLoad ui", uiClass.getUrl());
            let uiNode: cc.Node = this.preLoadDict.get(uiClass.getUrl());
            this.preLoadDict.delete(uiClass.getUrl())
            uiNode.parent = this.uiRoot;
            if (zOrder) { uiNode.zIndex = zOrder; }
            let ui = uiNode.getComponent(uiClass) as BaseUI;
            ui.tag = uiClass;
            this.uiList.push(ui);
            if (callback){
                callback(args);
            }
            return;
        }
        cc.resources.load(uiClass.getUrl(), function (completedCount: number, totalCount: number, item: any) {
            if (onProgress)
                onProgress(completedCount, totalCount, item);
        }, function (error, prefab) {
            if (error) {
                LogWrap.err("UI Load Fail",error);
                return;
            }
            if (this.getUI(uiClass)) {
                return;
            }
            let uiNode: cc.Node = cc.instantiate(prefab);
            uiNode.parent = this.uiRoot;
            if (zOrder) { uiNode.zIndex = zOrder; }
            let ui = uiNode.getComponent(uiClass) as BaseUI;
            ui.tag = uiClass;
            this.uiList.push(ui);
            if (callback)
                callback(args);
        }.bind(this));
    }

    public preLoadUI<T extends BaseUI>(uiClass: UIClass<T>,)
    {
        if (this.preLoadDict.get(uiClass.getUrl()))
            return
        cc.resources.load(
            uiClass.getUrl(), null,
            function (error, prefab) {
                if (error) {
                    LogWrap.err(error);
                    return;
                }
                let uiNode: cc.Node = cc.instantiate(prefab);
                this.preLoadDict.set(uiClass.getUrl(), uiNode);
                LogWrap.log("UI preLoad success", uiClass.getUrl());
            }.bind(this));
    }

    public closeUI<T extends BaseUI>(uiClass: UIClass<T>) {
        if (uiClass.getUrl() === WaitUI.getUrl()) // 不关闭仅隐藏
        {
            this.hideUI(WaitUI)
            return;
        }
        if (uiClass.getUrl() === Wait2UI.getUrl()) // 不关闭仅隐藏
        {
            this.hideUI(Wait2UI)
            return;
        }

        for (let i = 0; i < this.uiList.length; ++i) {
            if (this.uiList[i].tag === uiClass) {
                this.uiList[i].node.destroy();
                this.uiList.splice(i, 1);
                return;
            }
        }
    }

    public closeAllExceptOpenUI<T extends BaseUI>(uiClass: UIClass<T>) {
        for (let i = this.uiList.length - 1; i >= 0; --i) {
            if (this.uiList[i].tag === uiClass)
                continue;
            if (this.uiList[i].tag == WaitUI) // 不关闭仅隐藏
            {
                this.hideUI(WaitUI)
                continue;
            }
            if (this.uiList[i].tag == Wait2UI) // 不关闭仅隐藏
            {
                this.hideUI(Wait2UI)
                continue;
            }
            this.uiList[i].node.destroy();
            this.uiList.splice(i, 1);
        }
    }

    // 关闭除白名单之外的所有ui
    public closeUIExceptWhiteList(whiteList)
    {
        for (let i = this.uiList.length - 1; i >= 0; --i) {
            var isWhite = false
            for (let j = 0; j < whiteList.length; j++){
                if (this.uiList[i].tag === whiteList[j]){
                    isWhite = true
                    continue
                }
            }
            if (this.uiList[i].tag == WaitUI) // 不关闭仅隐藏
            {
                this.hideUI(WaitUI)
                continue;
            }
            if (this.uiList[i].tag === Wait2UI) // 不关闭仅隐藏
            {
                this.hideUI(Wait2UI)
                continue;
            }
            if (!isWhite){
                this.uiList[i].node.destroy();
                this.uiList.splice(i, 1);
            }
        }
    }

    public showUI<T extends BaseUI>(uiClass: UIClass<T>, callback?: Function) {
        let ui = this.getUI(uiClass);
        if (ui) {
            ui.node.active = true;
            ui.onShow();
            if (callback)
                callback();
        }
        else {
            this.openUI(uiClass, 0, () => {
                callback && callback();
                let ui = this.getUI(uiClass);
                ui.onShow();
            });
        }
    }

    public hideUI<T extends BaseUI>(uiClass: UIClass<T>) {
        let ui = this.getUI(uiClass);
        if (ui) {
            ui.node.active = false;
        }
    }

    public getUI<T extends BaseUI>(uiClass: UIClass<T>): BaseUI {
        for (let i = 0; i < this.uiList.length; ++i) {
            if (this.uiList[i].tag === uiClass) {
                return this.uiList[i];
            }
        }
        return null;
    }
}