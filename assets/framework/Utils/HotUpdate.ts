import { ListenerType } from './../../scripts/data/ListenerType';
import { LogWrap } from "./LogWrap";
import { MessageManager } from "../Manager/MessageManager";

const { ccclass, property } = cc._decorator;
@ccclass

export class HotUpdate extends cc.Component {
    private updating: boolean = false;
    private storagePath: string = "";
    private assetsManager: any;

    @property({ type: cc.Asset })
    manifestUrl: cc.Asset = null;

    @property(cc.ProgressBar)
    updateProgress: cc.ProgressBar = null;

    @property(cc.Label)
    updateLabel: cc.Label = null;

    @property(cc.Node)
    touzi: cc.Node = null;

    private checkCb(event) {
        LogWrap.log('Code: ' + event.getEventCode());
        let needUpdate = false;
        let beginGame = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST://0
                LogWrap.log("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST://1
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST://2
                LogWrap.log("Fail to download manifest file, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE://4
                LogWrap.log("Already up to date with the latest remote version.");
                beginGame = true;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND://3
                //发现更新
                LogWrap.log('New version found, please try to update.');
                needUpdate = true;
                break;
            default:
                return;
        }

        this.assetsManager.setEventCallback(null);
        this.updating = false;

        if (needUpdate)
            this.hotUpdate();

        if (beginGame)
            MessageManager.getInstance().messagePost(ListenerType.newVersionChange);
    }

    private updateCb(event) {

        let needRestart = false;
        let failed = false;
        LogWrap.log("event.getEventCode()",event.getEventCode())
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                {
                    //没有找到本地的manifest文件
                    LogWrap.log('No local manifest file found, hot update skipped.');
                    failed = true;
                }
                
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                {
                    //更新进度
                    this.updateProgress.progress = event.getPercent();
                
                    LogWrap.log( event.getPercent(), "资源下载进度");

                    if (event.getPercent() > 0)
                        this.updateLabel.string = "游戏更新中请稍后..." + Math.floor(event.getPercent() * 100) + '%';
                    else
                        this.updateLabel.string = "游戏更新中请稍后...";

                    let msg = event.getMessage();
                    this.touzi.position = cc.v3(-451.5+904*this.updateProgress.progress, -251.2);
                    if (msg) {
                        LogWrap.log('Updated file: ' + msg);
                        LogWrap.info(event.getPercent() / 100 + '% : ' + msg);
                    }
                }

                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                {
                    //无法下载远程服务器的版本文件
                    LogWrap.log('Fail to download manifest file, hot update skipped.');
                    failed = true;
                }

                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                {
                    //已经更新到最新的版本
                    LogWrap.log('Already up to date with the latest remote version.');
                    failed = true;
                }

                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                {
                    //更新完成
                    LogWrap.log('Update finished. ' + event.getMessage());
                    needRestart = true;
                }

                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                {
                    //更新失败
                    LogWrap.log('Update failed. ' + event.getMessage());
                    this.updating = false;
                }

                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                {
                    //资源更新中初现错误
                    LogWrap.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                }

                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                {
                    LogWrap.log(event.getMessage());
                }
                break;
            default:
                break;
        }

        if (failed) {
            this.assetsManager.setEventCallback(null);
            this.updating = false;
        }

        if (needRestart) {
            LogWrap.log("热更结束，重新后生效.....")
            this.assetsManager.setEventCallback(null);
            // Prepend the manifest's search path
            let searchPaths = jsb.fileUtils.getSearchPaths();
            let newPaths = this.assetsManager.getLocalManifest().getSearchPaths();
            LogWrap.log("newPaths:",newPaths)
            Array.prototype.unshift.apply(searchPaths, newPaths);
            // This value will be retrieved and appended to the default search path during game startup,
            // please refer to samples/js-tests/main.js for detailed usage.
            // !!! Re-add the search paths in main.js is very important, otherwise, new scripts won't take effect.
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }

    public checkUpdate(hoturl: string, hotver: string) {
        if (this.updating) {
            LogWrap.log('Checking or updating ...');
            return;
        }

        //修改本地配置文件
        this.handleLocalManifest(hoturl, hotver);

        //加载本地manifest
        if (this.assetsManager.getState() === jsb.AssetsManager.State.UNINITED) {
            // Resolve md5 url
            var url = this.manifestUrl.nativeUrl;
            this.assetsManager.loadLocalManifest(url);
        }

        if (!this.assetsManager.getLocalManifest() || !this.assetsManager.getLocalManifest().isLoaded()) {
            LogWrap.log('Failed to load local manifest ...');
            return;
        }
        this.assetsManager.setEventCallback(this.checkCb.bind(this));
        this.assetsManager.checkUpdate();
        this.updating = true;
    }

    private handleLocalManifest(hoturl: string, hotver: string) {
        //读取原始Manifest, 修改本地manifest文件，对应下载地址
        let filestring;
        if (jsb.fileUtils.isFileExist(this.storagePath + "/project.manifest"))
            filestring = jsb.fileUtils.getStringFromFile(this.storagePath + "/project.manifest");
        else
            filestring = jsb.fileUtils.getStringFromFile(this.manifestUrl.nativeUrl);

        // //转换成json
        let obj = JSON.parse(filestring);
        obj.packageUrl = hoturl + hotver + "/";
        obj.remoteManifestUrl = (hoturl + hotver + "/project.manifest").replace(/\s/g,'');
        obj.remoteVersionUrl = (hoturl + hotver + "/version.manifest").replace(/\s/g,'');
        LogWrap.log(hoturl,hotver);
        LogWrap.log(obj.remoteManifestUrl)
        LogWrap.log(obj.remoteVersionUrl)

        //保存成本地文件
        jsb.fileUtils.writeStringToFile(JSON.stringify(obj), this.storagePath + "/project.manifest")
    }

    private hotUpdate() {
        if (this.assetsManager && !this.updating) {
            this.assetsManager.setEventCallback(this.updateCb.bind(this));
            if (this.assetsManager.getState() === jsb.AssetsManager.State.UNINITED) {
                var url = this.manifestUrl.nativeUrl;
                this.assetsManager.loadLocalManifest(url);
                LogWrap.log("hotupdate..nativeUrl:",url)
            }
            this.assetsManager.update();
            this.updating = true;
        }
    }

    // use this for initialization
    onLoad() {
        // Hot update is only available in Native build
        if (!cc.sys.isNative)
            return;

        this.storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'hot-update-asset');
        LogWrap.log('Storage path for remote asset : ' + this.storagePath);

        // Setup your own version compare handler, versionA and B is versions in string
        // if the return value greater than 0, versionA is greater than B,
        // if the return value equals 0, versionA equals to B,
        // if the return value smaller than 0, versionA is smaller than B.
        let versionCompareHandle = function (versionA, versionB) {
            cc.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        // Init with empty manifest url for testing custom manifest
        this.assetsManager = new jsb.AssetsManager('', this.storagePath, versionCompareHandle);

        // Setup the verification callback, but we don't have md5 check function yet, so only print some message
        // Return true if the verification passed, otherwise return false
        this.assetsManager.setVerifyCallback(function (path, asset) {
            // When asset is compressed, we don't need to check its md5, because zip file have been deleted.
            let compressed = asset.compressed;
            // Retrieve the correct md5 value.
            let expectedMD5 = asset.md5;
            // asset.path is relative path and path is absolute.
            let relativePath = asset.path;
            // The size of asset file, but this value could be absent.
            let size = asset.size;
            if (compressed) {
                LogWrap.log("Verification passed : " + relativePath);
                return true;
            }
            else {
                LogWrap.log("Verification passed : " + relativePath + ' (' + expectedMD5 + ')');
                return true;
            }
        });

        LogWrap.log('Hot update is ready, please check or directly update.');

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            // Some Android device may slow down the download process when concurrent tasks is too much.
            // The value may not be accurate, please do more test and find what's most suitable for your game.
            this.assetsManager.setMaxConcurrentTask(2);
            LogWrap.log("Max concurrent tasks count have been limited to 2");
        }

        //进度条显示
        this.updateProgress.progress = 0;
        this.updateLabel.string = "";
        //覆盖安装大版本更新清理缓存
        this.cleanHotUpdateAsset(versionCompareHandle);
    }

    onDestroy() {
        if (this.assetsManager)
            this.assetsManager.setEventCallback(null);
    }

    cleanHotUpdateAsset(versionCompareHandle: any) {
        //过滤搜索路径
        let searchPaths = jsb.fileUtils.getSearchPaths();
        let searchPathsTemp = jsb.fileUtils.getSearchPaths().slice(0);
        //移除热更新搜索路径，获取包内版本
        for (let i = searchPathsTemp.length - 1; i >= 0; i--) {
            if (searchPathsTemp[i] == this.storagePath + "/")
                searchPathsTemp.splice(i, 1);
        }
        jsb.fileUtils.setSearchPaths(searchPathsTemp);
        //是否需要清除缓存，如果是本地版本大于缓存版本，就将缓存版本清除
        let appOriginVersionStr = jsb.fileUtils.getStringFromFile(this.manifestUrl.nativeUrl);
        jsb.fileUtils.setSearchPaths(searchPaths);
        if (!appOriginVersionStr)
            return;
        let appOriginVersion = JSON.parse(appOriginVersionStr);
        let hotUpdateVersion;
        if (!jsb.fileUtils.isFileExist(this.storagePath + "/project.manifest"))
            return;
        else {
            let filestring = jsb.fileUtils.getStringFromFile(this.storagePath + "/project.manifest");
            hotUpdateVersion = JSON.parse(filestring);
        }
        let result = versionCompareHandle(appOriginVersion.version, hotUpdateVersion.version);
        if (result >= 0) {
            //就清除热更新目录
            jsb.fileUtils.removeDirectory(this.storagePath + "/");
            jsb.fileUtils.createDirectory(this.storagePath);
            cc.audioEngine.stopAll();
            cc.game.restart();
        }
    }

    onClickXiuFu() {
        let schs = jsb.fileUtils.getSearchPaths();
        for (let i = 0; i < schs.length; i++) {
            let path = schs[i];
            var isDirExit = jsb.fileUtils.isDirectoryExist(path);
            LogWrap.log("isDirExit111:" + isDirExit);
            LogWrap.log("dirpath111:" + path);
            if (isDirExit) {
                var isSuccess = jsb.fileUtils.removeDirectory(path + "/");
                LogWrap.log("isSuccessRemoveDir:" + isSuccess);
            }
        }
        cc.sys.localStorage.removeItem("aLiYunConfig");
        cc.sys.localStorage.removeItem("currentReqConfigUrl");
        cc.sys.localStorage.removeItem("outTime");
        cc.audioEngine.stopAll();
        LogWrap.log("cc.game.restart");
        cc.game.restart();
    }
}
