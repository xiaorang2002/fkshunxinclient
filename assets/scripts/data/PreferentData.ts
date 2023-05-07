import { LogWrap } from './../../framework/Utils/LogWrap';
// 偏好数据对象

export class PreferentData {
    private static instance: PreferentData;

    public static getInstance(): PreferentData {
        if (this.instance == null)
        {
            this.instance = new PreferentData();
            this.instance.initDataByLocal()
        }

        return this.instance;
    }

    private gamePreference = new Map()

    private initDataByLocal() {
        var preferentData = cc.sys.localStorage.getItem("preferentData")
        if (!preferentData)
            return;
        try
        {
            var oData = JSON.parse(preferentData)
            this.initEnterGamePreferent(oData.templateList, oData.timeList)
        }
        catch (e)
        {
            LogWrap.err("local preferent data init error")
        }
    }

    private initEnterGamePreferent(templateList, timeList)
    {
        this.gamePreference.clear()
        if (templateList && templateList.length > 0)
        {
            for (var idx = 0; idx < templateList.length; idx++)
            {
                this.gamePreference.set(templateList[idx], timeList[idx])
            }
        }
    }

    // 根据进游戏更新偏好
    public updateEnterGamePreferent(template){
        if (!template)
            return
        // var count =this.gamePreference.get(template)
        // if (count)
        //     count += 1
        // else
        //     count = 1
        var nowTime = new Date().getTime()
        this.gamePreference.set(template, Math.floor(nowTime/1000))
        this.saveData()
    }

    public getPreferTemplateList()
    {
        var templateList = []
        this.gamePreference.forEach((time, tempalte)=>{
            templateList.push(tempalte)
        })
        // var resultList =  []
        // if (templateList.length > 0)
        //     resultList =  templateList.sort(function (a, b) { return this.gamePreference.get(a) - this.gamePreference.get(b)});
        return templateList
    }   

    public clearEnterGamePrefer()
    {
        this.gamePreference.clear()
        this.saveData()
    }

    private saveData()
    {
        var saveData = {}
        var templateList = []
        var timeList = []
        this.gamePreference.forEach((time, tempalte)=>{
            templateList.push(tempalte)
            timeList.push(time)
        })
        saveData ={templateList: templateList, timeList: timeList}
        cc.sys.localStorage.setItem("preferentData", JSON.stringify(saveData))
    }


}