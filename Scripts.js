// ==UserScript==
// @name         学习通小助手
// @namespace    unrival
// @version      1.01
// @description  后台任务、支持超星视频、文档、答题、自定义正确率、掉线自动登录、考试答题
// @author       unrival
// @run-at       document-end
// @storageName  unrivalxxt
// @connect      cx.icodef.com
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_setClipboard
// @match        *://*.chaoxing.com/*
// @match        *://*.edu.cn/*
// @match        *://*.nbdlib.cn/*
// @match        *://*.hnsyu.net/*
// @match        *://scriptcat.org/script-show-page/*
// @icon         http://pan-yz.chaoxing.com/favicon.ico
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_info
// @grant        GM_openInTab
// @license      Copycat Has No Dick
// @connect      mooc1-1.chaoxing.com
// @connect      mooc1.chaoxing.com
// @connect      mooc1-2.chaoxing.com
// @connect      passport2-api.chaoxing.com
// @connect      api.7j112.com
// @connect      tencent-api.7j112.com
// @connect      cx.icodef.com
// @contributionURL https://afdian.net/@unrival
// @antifeature payment
//如果脚本提示添加安全网址，请将脚本提示内容填写到下方区域，一行一个，如果不会，请加群询问

//安全网址请填写在上方空白区域
// ==/UserScript==
(()=>{
var maxRate = 300 , //倍速设置，倍速过高可能导致出现异常记录/清除进度，建议根据自己胆量修改。
    jumpType = 1 , // 0:智能模式，1:遍历模式，2:不跳转，如果智能模式出现无限跳转/不跳转情况，请切换为遍历模式
    disableMonitor = 0 ,// 0:无操作，1:解除多端学习监控，开启此功能后可以多端学习，不会被强制下线。
    accuracy = 100,//章节测试正确率百分比，在答题正确率在规定之上并且允许自动提交时才会提交答案
    randomDo = 0,//将0改为1，找不到答案的单选、多选、判断就会自动选【B、ABCD、错】，只在规定正确率不为100%时才生效
    autoLogin = 0, //掉线是否自动登录，1为自动登录，需要配置登录信息（仅支持手机号+密码登陆）
    phoneNumber = '', //自动登录的手机号，填写在单引号之间。
    password = '', //自动登录的密码，填写在单引号之间。
    kaoshiUrl = "mooc1.chaoxing.com/exam/test/reVersionTestStartNew",
    ctUrl = 'http://cx.icodef.com/wyn-nb?v=2'; //题库服务器，填写在两个单引号之间，由题库作者向您提供，不懂不要修改。
    rate = GM_getValue('unrivalrate','1'),
    getQueryVariable = (variable) => {
        let q = _l.search.substring(1),
            v = q.split("&"),
            r = false;
        for (let i = 0, l = v.length; i < l; i++) {
            let p = v[i].split("=");
            p[0] == variable && (r = p[1]);
        }
        return r;
    },
    getCookie=(name)=>{
        var ca,re=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
        if(ca=_d.cookie.match(re)){
            return unescape(ca[2]);
        }else{
            return '';
        }
    },
    _w = unsafeWindow,
    _d = _w.document,
    _l = _w.location,
    _p = _l.protocol,
    _h = _l.host,
    isEdge=_w.navigator.userAgent.includes("Edg/"),
    isFf=_w.navigator.userAgent.includes("Firefox"),
    isMobile = _w.navigator.userAgent.includes("Android"),
    stop = false,
    trim = (s)=>{
        return s.replace('javascript:void(0);','').replace(new RegExp("&nbsp;",("gm")),'').replace(/^\s+/, '').replace(/\s+$/, '').replace(new RegExp("，",("gm")),',').replace(new RegExp("。",("gm")),'.').replace(new RegExp("：",("gm")),':').replace(new RegExp("；",("gm")),';').replace(new RegExp("？",("gm")),'?').replace(new RegExp("（",("gm")),'(').replace(new RegExp("）",("gm")),')').replace(new RegExp("“",("gm")),'"').replace(new RegExp("”",("gm")),'"');
    },
    cVersion = 999,
    classId = getQueryVariable('clazzid')||getQueryVariable('clazzId')||getQueryVariable('classid')||getQueryVariable('classId'),
    courseId = getQueryVariable('courseid')||getQueryVariable('courseId');

// 考试答题设置
// 设置修改后，需要刷新或重新打开网课页面才会生效
var setting = {
        // 8E3 == 8000，科学记数法，表示毫秒数
        time: 5E3, // 默认响应速度为8秒，不建议小于5秒
        // 1代表开启，0代表关闭
        none: 0, // 未找到答案或无匹配答案时执行默认操作，默认关闭
        jump: 1, // 答题完成后自动切换，默认开启
        copy: 0, // 自动复制答案到剪贴板，也可以通过手动点击按钮或答案进行复制，默认关闭
        // 非自动化操作
        hide: 0, // 不加载答案搜索提示框，键盘↑和↓可以临时移除和加载，默认关闭
        scale: 0, // 富文本编辑器高度自动拉伸，用于文本类题目，答题框根据内容自动调整大小，默认关闭
    },
    _self = unsafeWindow,
    $ = _self.jQuery,
    UE = _self.UE;
 
if(parseFloat(rate)==parseInt(rate)){
    rate = parseInt(rate);
}else{
    rate = parseFloat(rate);
}
if(rate>maxRate){
    rate = 1;
    GM_setValue('unrivalrate',rate);
}
try{
    _w.top.unrivalReviewMode = GM_getValue('unrivalreview','0')||'0';
    _w.top.unrivalDoWork = GM_getValue('unrivaldowork','1')||'1';
    _w.top.unrivalAutoSubmit = GM_getValue('unrivalautosubmit','0')||'0';
    _w.top.unrivalAutoSave = GM_getValue('unrivalautosave','0')||'0';
}catch(e){}
if(_l.href.indexOf("knowledge/cards") >0){
    GM_setValue('unrivalUd',getCookie('_uid'));
    let allowBackground = false,
        spans = _d.getElementsByTagName('span');
    for(let i=0,l=spans.length;i<l;i++){
        if(spans[i].innerHTML.indexOf('章节未开放')!=-1){
            if(_l.href.indexOf("ut=s")!=-1){
                _l.href = _l.href.replace("ut=s","ut=t").replace(/&cpi=[0-9]{1,10}/,'');
            }else if(_l.href.indexOf("ut=t")!=-1){
                spans[i].innerHTML = '此课程为闯关模式，请回到上一章节完成学习任务！'
                return;
            }
            break;
        }
    }
    _w.top.unrivalPageRd = String(Math.random());
    if(!isFf){
        try{
            cVersion = parseInt(navigator.userAgent.match(/Chrome\/[0-9]{2,3}./)[0].replace('Chrome/','').replace('.',''));
        }catch(e){}
    }
    var busyThread = 0,
        getStr = (str, start, end)=> {
            let res = str.substring(str.indexOf(start),str.indexOf(end)).replace(start,'');
            return res ;
        },
        scripts = _d.getElementsByTagName('script'),
        param = null,
        rt='0.9';
    for(let i=0,l=scripts.length;i<l;i++){
        if(scripts[i].innerHTML.indexOf('mArg = "";')!=-1&&scripts[i].innerHTML.indexOf('==UserScript==')==-1){
            param = getStr(scripts[i].innerHTML,'try{\n    mArg = ',';\n}catch(e){');
        }
    }
    if(param==null){
        return;
    }
    try{
        vrefer = _d.getElementsByClassName('ans-attach-online ans-insertvideo-online')[0].src;
    }catch(e){
        vrefer = _p+'//'+_h+'/ananas/modules/video/index.html?v=2022-0528-1945';
    }
    _d.getElementsByTagName("html")[0].innerHTML=`
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>学习通小助手</title>
        <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" name="viewport">
        <link href="https://z.chaoxing.com/yanshi/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="row" style="margin: 10px;">
            <div class="col-md-6 col-md-offset-3">
                <div class="header clearfix">
                    <h3 class="text-muted" style="margin-top: 20px;margin-bottom: 0;float: left;"><a href="https://github.com/BaiSugar/ChaoXingScript" target="view_window">学习通小助手v1.0&ensp;</a></h3><div id="onlineNum"></div>
                </div>
                <hr style="margin-top: 10px;margin-bottom: 20px;">
                <div class="panel panel-info" id="normalQuery">
                    <div class="panel-heading">任务配置</div>
                    <div class="panel-body">
                        <div>
                            <div style="padding: 0;font-size: 20px;float: left;">视频倍速：</div>
                            <div>
                                <input type="number" id="unrivalRate" style="width: 80px;">
                                &ensp;
                                <a id='updateRateButton' class="btn btn-default">保存</a>
                                &nbsp;|&nbsp;
                                <a id='reviewModeButton' class="btn btn-default">复习模式</a>
                                &nbsp;|&nbsp;
                                <a id='videoTimeButton' class="btn btn-default">查看学习进度</a>
                                &nbsp;|&nbsp;
                                <a id='fuckMeModeButton' class="btn btn-default" href="https://github.com/BaiSugar/ChaoXingScript/" target="view_window">Github</a>
                            </div><br>
                            <div style="padding: 0;font-size: 20px;float: left;">章节测试：</div>
                            <a id='autoDoWorkButton' class="btn btn-default">自动答题</a>&nbsp;|&nbsp;
                            <a id='autoSubmitButton' class="btn btn-default">自动提交</a>&nbsp;|&nbsp;
                            <a id='autoSaveButton' class="btn btn-default">自动保存</a>
                        </div>
                    </div>
                </div>
                <div class="panel panel-info" id='videoTime' style="display: none;height: 300px;">
                    <div class="panel-heading">学习进度</div>
                    <div class="panel-body" style="height: 100%;">
                        <iframe id="videoTimeContent" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 85%;"></iframe>
                    </div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">任务列表</div>
                    <div class="panel-body" id='joblist'>
                    </div>
                </div>
                <div class="panel panel-info">
                    <div class="panel-heading">运行日志</div>
                    <div class="panel-body">
                        <div id="result" style="overflow:auto;line-height: 30px;">
                            <div id="log">
                                <span style="color: red">[00:00:00]如果此提示不消失，说明页面出现了错误，请联系作者</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="panel panel-info" id='workPanel' style="display: none;height: 1000px;">
                    <div class="panel-heading">章节测试</div>
                    <div class="panel-body" id='workWindow' style="height: 100%;">
                        <iframe id="frame_content" name="frame_content" src="" frameborder="0" scrolling="auto"
                            style="width: 100%;height: 95%;"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </body>
</html>
`;
    var logs = {
        "logArry": [],
        "addLog": function(str, color = "black") {
            if (this.logArry.length >= 50) {
                this.logArry.splice(0, 1);
            }
            var nowTime = new Date();
            var nowHour = (Array(2).join(0) + nowTime.getHours()).slice(-2);
            var nowMin = (Array(2).join(0) + nowTime.getMinutes()).slice(-2);
            var nowSec = (Array(2).join(0) + nowTime.getSeconds()).slice(-2);
            this.logArry.push("<span style='color: " + color + "'>[" + nowHour + ":" + nowMin + ":" +
                nowSec + "] " + str + "</span>");
            let logStr = "";
            for (let logI = 0, logLen = this.logArry.length; logI < logLen; logI++) {
                logStr += this.logArry[logI] + "<br>";
            }
            _d.getElementById('log').innerHTML = logStr;
            var logElement = _d.getElementById('log');
            logElement.scrollTop = logElement.scrollHeight;
        }
    },
        htmlHook = setInterval(function(){
        if(_d.getElementById('unrivalRate')&&_d.getElementById('updateRateButton')&&_d.getElementById('reviewModeButton')&&_d.getElementById('autoDoWorkButton')&&_d.getElementById('autoSubmitButton')&&_d.getElementById('autoSaveButton')){
            function afevaabrr(){
                if(Math.round(new Date() / 1000)-parseInt(GM_getValue('unrivalBackgroundVideoEnable','6'))<15){
                    allowBackground = true;
                    _d.getElementById('fuckMeModeButton').setAttribute('href','unrivalxxtbackground/');
                }else{
                    _d.getElementById('fuckMeModeButton').setAttribute('href','https://github.com/BaiSugar/ChaoXingScript');
                    allowBackground = false;
                }
            }
            afevaabrr();
            clearInterval(htmlHook);
            if(cVersion<86){
                logs.addLog('\u60a8\u7684\u6d4f\u89c8\u5668\u5185\u6838\u8fc7\u8001\uff0c\u8bf7\u66f4\u65b0\u7248\u672c\u6216\u4f7f\u7528\u4e3b\u6d41\u6d4f\u89c8\u5668\uff0c\u63a8\u8350\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0077\u0077\u0077\u002e\u006d\u0069\u0063\u0072\u006f\u0073\u006f\u0066\u0074\u002e\u0063\u006f\u006d\u002f\u007a\u0068\u002d\u0063\u006e\u002f\u0065\u0064\u0067\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u0065\u0064\u0067\u0065\u6d4f\u89c8\u5668\u0026\u0065\u006e\u0073\u0070\u003b\u007c\u003c\u002f\u0061\u003e\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0062\u0072\u006f\u0077\u0073\u0065\u0072\u002e\u0033\u0036\u0030\u002e\u0063\u006e\u002f\u0065\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u007c\u0026\u0065\u006e\u0073\u0070\u003b\u0033\u0036\u0030\u6781\u901f\u6d4f\u89c8\u5668\u0028\u0036\u0034\u4f4d\u7248\u672c\u0029\u003c\u002f\u0061\u003e','red');
                stop = true;
                return;
            }
            if(isMobile){
                logs.addLog('手机浏览器不保证能正常运行','red');
            }
            _d.getElementById('unrivalRate').value = rate;
            _d.getElementById('updateRateButton').onclick = function(){
                let urate = _d.getElementById('unrivalRate').value;
                if(parseFloat(urate)==parseInt(urate)){
                    urate = parseInt(urate);
                }else{
                    urate = parseFloat(urate);
                }
                if(urate>maxRate){
                    _d.getElementById('unrivalRate').value = rate;
                    logs.addLog('已超过脚本限制最高倍速，修改失败，<b>倍速大于1可能会面临清除进度/全校通报风险</b>，如有特殊需求请修改脚本代码内限制参数','red');
                    return;
                }
                GM_setValue('unrivalrate',urate);
                rate = urate;
                if(urate>0){
                    logs.addLog('视频倍速已更新为'+urate+'倍，将在3秒内生效','green');
                }else{
                    logs.addLog('奇怪的倍速，将会自动跳过视频任务','red');
                }
            }
            _d.getElementById('reviewModeButton').onclick=function(){
                let reviewButton = _d.getElementById('reviewModeButton');
                if(reviewButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('reviewModeButton').setAttribute('class','btn btn-success');
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过','green');
                    GM_setValue('unrivalreview','1');
                    _w.top.unrivalReviewMode = '1';
                }else{
                    _d.getElementById('reviewModeButton').setAttribute('class','btn btn-default');
                    logs.addLog('复习模式已关闭，遇到已完成的视频任务会自动跳过','green');
                    GM_setValue('unrivalreview','0');
                    _w.top.unrivalReviewMode = '0';
                }
            }
            _d.getElementById('autoDoWorkButton').onclick=function(){
                let autoDoWorkButton = _d.getElementById('autoDoWorkButton');
                if(autoDoWorkButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoDoWorkButton').setAttribute('class','btn btn-success');
                    logs.addLog('自动做章节测试已开启，将会自动做章节测试','green');
                    GM_setValue('unrivaldowork','1');
                    _w.top.unrivalDoWork = '1';
                }else{
                    _d.getElementById('autoDoWorkButton').setAttribute('class','btn btn-default');
                    logs.addLog('自动做章节测试已关闭，将不会自动做章节测试','green');
                    GM_setValue('unrivaldowork','0');
                    _w.top.unrivalDoWork = '0';
                }
            }
            _d.getElementById('autoSubmitButton').onclick=function(){
                let autoSubmitButton = _d.getElementById('autoSubmitButton');
                if(autoSubmitButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoSubmitButton').setAttribute('class','btn btn-success');
                    logs.addLog('符合提交标准的章节测试将会自动提交','green');
                    GM_setValue('unrivalautosubmit','1');
                    _w.top.unrivalAutoSubmit = '1';
                }else{
                    _d.getElementById('autoSubmitButton').setAttribute('class','btn btn-default');
                    logs.addLog('章节测试将不会自动提交','green');
                    GM_setValue('unrivalautosubmit','0');
                    _w.top.unrivalAutoSubmit = '0';
                }
            }
            _d.getElementById('autoSaveButton').onclick=function(){
                let autoSaveButton = _d.getElementById('autoSaveButton');
                if(autoSaveButton.getAttribute('class')=='btn btn-default'){
                    _d.getElementById('autoSaveButton').setAttribute('class','btn btn-success');
                    logs.addLog('不符合提交标准的章节测试将会自动保存','green');
                    GM_setValue('unrivalautosave','1');
                    _w.top.unrivalAutoSave = '1';
                }else{
                    _d.getElementById('autoSaveButton').setAttribute('class','btn btn-default');
                    logs.addLog('不符合提交标准的章节测试将不会自动保存，等待用户自己操作','green');
                    GM_setValue('unrivalautosave','0');
                    _w.top.unrivalAutoSave = '0';
                }
            }
            _d.getElementById('videoTimeButton').onclick=function(){
                _d.getElementById('videoTime').style.display = 'block';
                _d.getElementById('videoTimeContent').src=_p+'//stat2-ans.chaoxing.com/task/s/index?courseid='+courseId+'&clazzid='+classId;
            }
        }
    },100),
        loopjob= ()=>{
        if(_w.top.unrivalScriptList.length>1){
            logs.addLog('您同时开启了多个刷课脚本，会挂科的！','red');
        }
        if(cVersion<8.6*10){
            logs.addLog('\u60a8'+'\u7684'+'\u6d4f'+'\u89c8'+'\u5668'+'\u5185'+'\u6838'+'\u8fc7'+'\u8001'+'\uff0c'+'\u8bf7'+'\u66f4'+'\u65b0'+'\u7248'+'\u672c'+'\u6216'+'\u4f7f'+'\u7528'+'\u4e3b'+'\u6d41'+'\u6d4f'+'\u89c8'+'\u5668'+'\uff0c\u63a8\u8350\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0077\u0077\u0077\u002e\u006d\u0069\u0063\u0072\u006f\u0073\u006f\u0066\u0074\u002e\u0063\u006f\u006d\u002f\u007a\u0068\u002d\u0063\u006e\u002f\u0065\u0064\u0067\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u0065\u0064\u0067\u0065\u6d4f\u89c8\u5668\u0026\u0065\u006e\u0073\u0070\u003b\u007c\u003c\u002f\u0061\u003e\u003c\u0061\u0020\u0068\u0072\u0065\u0066\u003d\u0022\u0068\u0074\u0074\u0070\u0073\u003a\u002f\u002f\u0062\u0072\u006f\u0077\u0073\u0065\u0072\u002e\u0033\u0036\u0030\u002e\u0063\u006e\u002f\u0065\u0065\u0022\u0020\u0074\u0061\u0072\u0067\u0065\u0074\u003d\u0022\u0076\u0069\u0065\u0077\u005f\u0077\u0069\u006e\u0064\u006f\u0077\u0022\u003e\u007c\u0026\u0065\u006e\u0073\u0070\u003b\u0033\u0036\u0030\u6781\u901f\u6d4f\u89c8\u5668\u0028\u0036\u0034\u4f4d\u7248\u672c\u0029\u003c\u002f\u0061\u003e','red');
            stop = true;
            return;
        }
        if(stop){
            return;
        }
        let missionli = missionList;
        if(missionli==[]){
            setTimeout(loopjob,500);
            return;
        }
        for(let itemName in missionli){
            if(missionli[itemName]['running']){
                setTimeout(loopjob,500);
                return;
            }
        }
        for(let itemName in missionli){
            if(!missionli[itemName]['done']){
                switch(missionli[itemName]['type']){
                    case 'video':doVideo(missionli[itemName]);
                    break;
                    case 'document':doDocument(missionli[itemName]);
                    break;
                    case 'work':doWork(missionli[itemName]);
                    break;
                }
                setTimeout(loopjob,500);
                return;
            }
        }
        if(busyThread <=0){
            if(jumpType!=2){
                _w.top.jump = true;
                logs.addLog('所有任务处理完毕，5秒后自动下一章','green');
            }else{
                logs.addLog('所有任务处理完毕，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
            }
            clearInterval(loopjob);
        }else{
            setTimeout(loopjob,500);
        }
    },
        readyCheck = ()=>{
        setTimeout(function(){
            try{
                if(_w.top.unrivalReviewMode=='1'){
                    logs.addLog('复习模式已开启，遇到已完成的视频任务不会跳过','green');
                    _d.getElementById('reviewModeButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalReviewMode]);
                }
                if(_w.top.unrivalDoWork=='1'){
                    logs.addLog('自动做章节测试已开启，将会自动做章节测试','green');
                    _d.getElementById('autoDoWorkButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalDoWork]);
                }
                _d.getElementById('autoSubmitButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalAutoSubmit]);
                _d.getElementById('autoSaveButton').setAttribute('class',['btn btn-default','btn btn-success'][_w.top.unrivalAutoSave]);
            }catch(e){
                console.log(e);
                readyCheck();
                return;
            }
        },500);
    }
    readyCheck();
    try{
        var pageData = JSON.parse(param);
    }catch(e){
        if(jumpType!=2){
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动下一章','green');
        }else{
            logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
        }
        return;
    }
    var data = pageData['defaults'],
        jobList = [],
        classId = data['clazzId'],
        chapterId = data['knowledgeid'],
        reportUrl = data['reportUrl'];
    for(let i=0,l=pageData['attachments'].length;i<l;i++){
        let item = pageData['attachments'][i];
        if(item['job']!=true||item['isPassed']==true){
            if(_w.top.unrivalReviewMode=='1'&&item['type']=='video'){
                jobList.push(item);
            }else{
                continue;
            }
        }else{
            jobList.push(item);
        }
    }
    var video_getReady=(item)=>{
            let statusUrl = _p+'//'+_h+'/ananas/status/'+item['property']['objectid']+'?k='+getCookie('fid')+'&flag=normal&_dc='+String(Math.round(new Date())),
                doubleSpeed = item['property']['doublespeed'];
            busyThread +=1;
            GM_xmlhttpRequest({
                method: "get",
                headers: {
                    'Host': _h,
                    'Referer': vrefer,
                    'Sec-Fetch-Site':'same-origin'
                },
                url: statusUrl,
                onload: function(res) {
                    try{
                        busyThread -=1;
                        let videoInfo = JSON.parse(res.responseText),
                            duration = videoInfo['duration'],
                            dtoken = videoInfo['dtoken'];
                        if(duration==undefined){
                            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[无效视频]'+item['property']['name']+`
                                </div>
                            </div>`
                            return;
                        }
                        missionList['m'+item['jobid']]={
                            'type':'video',
                            'dtoken':dtoken,
                            'duration':duration,
                            'objectId':item['property']['objectid'],
                            'otherInfo':item['otherInfo'],
                            'doublespeed':doubleSpeed,
                            'jobid':item['jobid'],
                            'name':item['property']['name'],
                            'done':false,
                            'running':false
                        };
                        _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[视频]'+item['property']['name']+`
                                </div>
                            </div>`
                    }catch(e){
                    }
                },
                onerror:function(err){
                    console.log(err);
                    if(err.error.indexOf('@connect list')>=0){
                        logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                        logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                        stop = true;
                    }else{
                        logs.addLog('获取任务详情失败','red');
                        logs.addLog('错误原因：'+err.error,'red');
                    }
                }
            });
        },
        doVideo = (item)=>{
            if(rate<=0){
                missionList['m'+item['jobid']]['running']=true;
                logs.addLog('奇怪的倍速，视频已自动跳过','red');
                setTimeout(function(){
                    missionList['m'+item['jobid']]['running']=false;
                    missionList['m'+item['jobid']]['done']=true;
                },5000);
                return;
            }
            let videojs_id = String(parseInt(Math.random() * 9999999));
            _d.cookie='videojs_id='+videojs_id+';path=/'
            logs.addLog('开始刷视频：'+item['name']+'，倍速：'+String(rate)+'倍');
            logs.addLog('视频观看信息每60秒上报一次，请耐心等待，脚本在正常运行，请不要在60秒内卸载脚本然后去评论脚本不能用，奶奶滴！','green');
            if(item['doublespeed']==0&&rate!=1&&_w.top.unrivalReviewMode=='0'){
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“清除进度”！！！','red');
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“清除进度”！！！','red');
                logs.addLog('倍速播放此视频有99%几率导致“老师发现”、“清除进度”！！！','red');
            }
            let playTime = 0,
                playsTime = 0,
                isdrag = '3',
                times = 0,
                encUrl = '',
                first = true,
                loop = setInterval(function(){
                    if(rate<=0){
                        clearInterval(loop);
                        logs.addLog('奇怪的倍速，视频已自动跳过','red');
                        setTimeout(function(){
                            missionList['m'+item['jobid']]['running']=false;
                            missionList['m'+item['jobid']]['done']=true;
                        },5000);
                        return;
                    }
                    playsTime += rate;
                    playTime = Math.ceil(playsTime);
                    if(times==0||times%60==0||playTime>=item['duration']){
                        if(first){
                            playTime = 0;
                        }
                        if(playTime>=item['duration']){
                            clearInterval(loop);
                            playTime = item['duration'];
                            isdrag = '4';
                        }else if(playTime>0){
                            isdrag = '0';
                        }
                        busyThread +=1;
                        let _bold_playTime = playTime;
                        GM_xmlhttpRequest({
                            method: "get",
                            url: "",
                            onload: function(res) {
                                var enc_Unencrypted = "["+classId+"]["+GM_getValue('unrivalUd','666')+"]["+item['jobid']+"]["+item['objectId']+"]["+_bold_playTime*1000+"][d_yHJ!$pdA~5]["+item['duration']*1000+"][0_"+item['duration']+"]";
                                var enc = md5(enc_Unencrypted,32);
                                logs.addLog("视频enc: "+enc,'green');
                                let reportsUrl = reportUrl+'/'+item['dtoken']+'?clazzId='+classId+'&playingTime='+_bold_playTime+'&duration='+item['duration']+'&clipTime=0_'+item['duration']+'&objectId='+item['objectId']+'&otherInfo='+item['otherInfo']+'&jobid='+item['jobid']+'&userid='+ GM_getValue('unrivalUd','666')+'&isdrag='+isdrag+'&view=pc&enc='+enc+'&rt='+rt+'&dtype=Video&_t='+String(Math.round(new Date()));
                                GM_xmlhttpRequest({
                                    method: "get",
                                    headers: {
                                        'Host': _h,
                                        'Referer': vrefer,
                                        'Sec-Fetch-Site':'same-origin',
                                        'Content-Type': 'application/json'
                                    },
                                    url: reportsUrl,
                                    onload: function(res) {
                                        if(GM_getValue('unrivalUd','666')!=getCookie('_uid')){
                                            stop = true;
                                            logs.addLog('\u591a\u8d26\u53f7\u540c\u5237\u4f1a\u5bfc\u81f4\u5f02\u5e38\uff0c\u8bf7\u5173\u95ed\u6240\u6709\u6d4f\u89c8\u5668\u7a97\u53e3\u540e\u91cd\u8bd5','red');
                                        }
                                        try{
                                            busyThread -=1;
                                            let ispass = JSON.parse(res.responseText);
                                            first = false;
                                            if(ispass['isPassed']&&_w.top.unrivalReviewMode=='0'){
                                                logs.addLog('视频任务已完成','green');
                                                missionList['m'+item['jobid']]['running']=false;
                                                missionList['m'+item['jobid']]['done']=true;
                                                clearInterval(loop);
                                            }else if(isdrag == '4'){
                                                if(_w.top.unrivalReviewMode=='1'){
                                                    logs.addLog('视频已观看完毕','green');
                                                }else{
                                                    logs.addLog('视频已观看完毕，但视频任务未完成','red');
                                                }
                                                missionList['m'+item['jobid']]['running']=false;
                                                missionList['m'+item['jobid']]['done']=true;
                                                try{
                                                    clearInterval(loop);
                                                }catch(e){

                                                }
                                            }else{
                                                logs.addLog(item['name']+'已观看'+_bold_playTime+'秒，剩余大约'+String(item['duration']-_bold_playTime)+'秒');
                                            }
                                        }catch(e){
                                            console.log(e);
                                            if(res.responseText.indexOf('验证码')>=0){
                                                logs.addLog('已被超星风控，请<a href="'+reportsUrl+'" target="_blank">点我处理</a>，60秒后自动刷新页面','red');
                                                missionList['m'+item['jobid']]['running']=false;
                                                clearInterval(loop);
                                                stop = true;
                                                setTimeout(function(){
                                                    _l.reload();
                                                },60000);
                                                return;
                                            }
                                            if(rt=='0.9'){
                                                if(first){
                                                    logs.addLog('超星返回错误信息，尝试更换参数','orange');
                                                    rt='1';
                                                    times = -3;
                                                }else{
                                                    logs.addLog('超星返回错误信息，十秒后重试(1)','red');
                                                    times = -10;
                                                }
                                                return;
                                            }else{
                                                if(first){
                                                    rt='0.9';
                                                }
                                                logs.addLog('超星返回错误信息，十秒后重试(2)','red');
                                                times = -10;
                                                console.log(res.responseText);
                                                return;
                                            }
                                        }
                                    },
                                    onerror:function(err){
                                        console.log(err);
                                        if(err.error.indexOf('@connect list')>=0){
                                            logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                                            logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                                            stop = true;
                                        }else{
                                            logs.addLog('观看视频失败','red');
                                            logs.addLog('错误原因：'+err.error,'red');
                                        }
                                        missionList['m'+item['jobid']]['running']=false;
                                        clearInterval(loop);
                                    }
                                });
                            },
                            onerror:function(err){
                                console.log(err);
                                logs.addLog('获取视频enc失败，请检查脚本插件是否有完整的访问权限，具体请见脚本下载页','red');
                                missionList['m'+item['jobid']]['running']=false;
                                clearInterval(loop);
                            }
                        });
                    }
                    times+=1;
                },1000);
                missionList['m'+item['jobid']]['running']=true;
        },
        doDocument=(item)=>{
            missionList['m'+item['jobid']]['running']=true;
            logs.addLog('开始刷文档：'+item['name']);
            setTimeout(function(){
                busyThread += 1;
                GM_xmlhttpRequest({
                    method: "get",
                    url: _p+'//'+_h+'/ananas/job/document?jobid='+item['jobid']+'&knowledgeid='+chapterId+'&courseid='+courseId+'&clazzid='+classId+'&jtoken='+item['jtoken'],
                    onload: function(res) {
                        try{
                            busyThread -= 1;
                            let ispass = JSON.parse(res.responseText);
                            if(ispass['status']){
                                logs.addLog('文档任务已完成','green');
                            }else{
                                logs.addLog('文档已阅读完成，但任务点未完成','red');
                            }
                            
                        }catch(err){
                            console.log(err);
                            console.log(res.responseText);
                            logs.addLog('解析文档内容失败','red');
                        }
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    },
                    onerror:function(err){
                        console.log(err);
                        if(err.error.indexOf('@connect list')>=0){
                            logs.addLog('请添加安全网址，将 【 //@connect      '+_h+' 】方括号里的内容(不包括方括号)添加到脚本代码内指定位置，否则脚本无法正常运行，如图所示：','red');
                            logs.addLog('<img src="https://pan-yz.chaoxing.com/thumbnail/0,0,0/609a8b79cbd6a91d10c207cf2b5f368d">');
                            stop = true;
                        }else{
                            logs.addLog('阅读文档失败','red');
                            logs.addLog('错误原因：'+err.error,'red');
                        }
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    }
                });
            },parseInt(Math.random()*2000+9000,10))
        },
        doWork = (item)=>{
            missionList['m'+item['jobid']]['running']=true;
            logs.addLog('开始刷章节测试：'+item['name']);
            logs.addLog('您设置的答题正确率为：'+String(accuracy)+'%，只有在高于此正确率时才会提交测试','blue');
            logs.addLog('您设置的题库接口为：'+ctUrl,'blue');
            _d.getElementById('workPanel').style.display = 'block';
            _d.getElementById('frame_content').src=_p+'//'+_h+'/work/phone/work?workId='+item['jobid'].replace('work-','')+'&courseId='+courseId+'&clazzId='+classId+'&knowledgeId='+chapterId+'&jobId='+item['jobid']+'&enc='+item['enc'];
            _w.top.unrivalWorkInfo='';
            _w.top.unrivalDoneWorkId='';
            setInterval(function(){
                if(_w.top.unrivalWorkInfo!=''){
                    logs.addLog(_w.top.unrivalWorkInfo);
                    _w.top.unrivalWorkInfo='';
                }
            },100);
            let checkcross=setInterval(function(){
                if(_w.top.unrivalWorkDone==false){
                    clearInterval(checkcross);
                    return;
                }
                let ifW = _d.getElementById('frame_content').contentWindow;
                try{
                    ifW.location.href;
                }catch(e){
                    console.log(e);
                    if(e.message.indexOf('cross-origin')!=-1){
                        clearInterval(checkcross);
                        _w.top.unrivalWorkDone = true;
                        return;
                    }
                }
            },2000);
            let workDoneInterval = setInterval(function(){
                if(_w.top.unrivalWorkDone){
                    _w.top.unrivalWorkDone = false;
                    clearInterval(workDoneInterval);
                    _w.top.unrivalDoneWorkId = '';
                    _d.getElementById('workPanel').style.display = 'none';
                    _d.getElementById('frame_content').src='';
                    setTimeout(function(){
                        missionList['m'+item['jobid']]['running']=false;
                        missionList['m'+item['jobid']]['done']=true;
                    },5000);
                }
            },500);
        },
        missionList = [];
    if(jobList.length<=0){
        if(jumpType!=2){
            _w.top.jump = true;
            logs.addLog('此页无任务，5秒后自动下一章','green');
        }else{
            logs.addLog('此页无任务，用户设置为不跳转，脚本已结束运行，如需自动跳转，请编辑脚本代码参数','green');
        }
        return;
    }
    for(let i=0,l=jobList.length;i<l;i++){
        let item = jobList[i];
        if(item['type']=='video'){
            video_getReady(item);
        }else if(item['type']=='document'){
            missionList['m'+item['jobid']]={
                'type':'document',
                'jtoken':item['jtoken'],
                'jobid':item['jobid'],
                'name':item['property']['name'],
                'done':false,
                'running':false
            };
            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[文档]'+item['property']['name']+`
                                </div>
                            </div>`
        }else if(item['type']=='workid'&&_w.top.unrivalDoWork=='1'){
            missionList['m'+item['jobid']]={
                'type':'work',
                'workid':item['property']['workid'],
                'jobid':item['jobid'],
                'name':item['property']['title'],
                'enc':item['enc'],
                'done':false,
                'running':false
            };
            _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'[章节测试]'+item['property']['title']+`
                                </div>
                            </div>`
        }else{
            try{
                let jobName = item['property']['name'];
                if(jobName==undefined){
                    jobName = item['property']['title'];
                }
                _d.getElementById('joblist').innerHTML += `
                            <div class="panel panel-default">
                                <div class="panel-body">
                                    `+'已跳过：'+jobName+`
                                </div>
                            </div>`
            }catch(e){
            }
        }
    }
    loopjob();
}else if(_l.href.indexOf("mycourse/studentstudy") >0){
    try{
        _w.unrivalScriptList.push('Fuck me please');
    }catch(e){
        _w.unrivalScriptList = ['Fuck me please'];
    }
    function checkOffline(){
        let dleft = _d.getElementsByClassName('left');
        if(dleft.length==1){
            let img=dleft[0].getElementsByTagName('img');
            if(img.length==1){
                if(img[0].src.indexOf('loading.gif')!=-1){
                    return true;
                }
            }
        }
        return false;
    }
    setInterval(function(){
        if(checkOffline()){
            setTimeout(function(){
                if(checkOffline()){
                    _l.reload();
                }
            },10000)
        }
    },3000);
    _w.unrivalgetTeacherAjax = _w.getTeacherAjax;
    _w.getTeacherAjax=(courseid,classid,cid)=>{
        if(cid==getQueryVariable('chapterId')){
            return;
        }
        _w.top.unrivalPageRd = '';
        _w.unrivalgetTeacherAjax(courseid,classid,cid);
    }
    if(disableMonitor == 1){
        _w.appendChild = _w.Element.prototype.appendChild;
        _w.Element.prototype.appendChild = function(){
            try{
                if(arguments[0].src.indexOf('detect.chaoxing.com')>0){
                    return;
                }
            }catch(e){}
            _w.appendChild.apply(this, arguments);
        };
    }
    
    _w.jump = false;
    setInterval(function(){
        if(getQueryVariable('mooc2')=='1'){
            let tabs= _d.getElementsByClassName('posCatalog_select');
            for(let i=0,l=tabs.length;i<l;i++){
                let tabId = tabs[i].getAttribute('id');
                if(tabId.indexOf('cur')>=0&&tabs[i].getAttribute('class')=='posCatalog_select'){
                    tabs[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+tabId.replace('cur','')+"');");
                }
            }
        }else{
            let h4s = _d.getElementsByTagName('h4'),
                h5s = _d.getElementsByTagName('h5');
            for(let i=0,l=h4s.length;i<l;i++){
                if(h4s[i].getAttribute('id').indexOf('cur')>=0){
                    h4s[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+h4s[i].getAttribute('id').replace('cur','')+"');");
                }
            }
            for(let i=0,l=h5s.length;i<l;i++){
                if(h5s[i].getAttribute('id').indexOf('cur')>=0){
                    h5s[i].setAttribute('onclick',"getTeacherAjax('"+courseId+"','"+classId+"','"+h5s[i].getAttribute('id').replace('cur','')+"');");
                }
            }
        }
    },1000);
    setInterval(function(){
        let but = null;
        if(_w.jump){
            _w.jump = false;
            _w.top.unrivalDoneWorkId = '';
            _w.jjump =(rd)=>{
                if(rd!=_w.top.unrivalPageRd){
                    return;
                }
                try{
                    setTimeout(function(){
                        if(jumpType == 1){
                            if(getQueryVariable('mooc2')=='1'){
                                but = _d.getElementsByClassName('jb_btn jb_btn_92 fs14 prev_next next');
                            }else{
                                but = _d.getElementsByClassName('orientationright');
                            }
                            try{
                                setTimeout(function(){
                                    if(rd!=_w.top.unrivalPageRd){
                                        return;
                                    }
                                    but[0].click();
                                },2000);
                            }catch(e){
                            }
                            return;
                        }
                        if(getQueryVariable('mooc2')=='1'){
                            let ul = _d.getElementsByClassName('prev_ul')[0],
                                lis = ul.getElementsByTagName('li');
                            for(let i=0,l=lis.length;i<l;i++){
                                if(lis[i].getAttribute('class')=='active'){
                                    if(i+1>=l){
                                        break;
                                    }else{
                                        try{
                                            lis[i+1].click();
                                        }catch(e){}
                                        return;
                                    }
                                }
                            }
                            let tabs= _d.getElementsByClassName('posCatalog_select');
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].getAttribute('class')=='posCatalog_select posCatalog_active'){
                                    while(i+1<tabs.length){
                                        let nextTab= tabs[i+1];
                                        if((nextTab.innerHTML.includes('icon_Completed prevTips')&&_w.top.unrivalReviewMode=='0')||nextTab.innerHTML.includes('catalog_points_er prevTips')){
                                            i++;
                                            continue;
                                        }
                                        if(nextTab.id.indexOf('cur')<0){
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function(){
                                            if(rd!=_w.top.unrivalPageRd){
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        },2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }else{
                            let div = _d.getElementsByClassName('tabtags')[0],
                                spans = div.getElementsByTagName('span');
                                for(let i=0,l=spans.length;i<l;i++){
                                    if(spans[i].getAttribute('class').indexOf('currents')>=0){
                                        if(i+1==l){
                                            break;
                                        }else{
                                            try{
                                                spans[i+1].click();
                                            }catch(e){}
                                            return;
                                        }
                                    }
                                }
                            let tabs= _d.getElementsByTagName('span'),
                                newTabs = [];
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].getAttribute('style')!=null&&tabs[i].getAttribute('style').indexOf('cursor:pointer;height:18px;')>=0){
                                    newTabs.push(tabs[i]);
                                }
                            }
                            tabs = newTabs;
                            for(let i=0,l=tabs.length;i<l;i++){
                                if(tabs[i].parentNode.getAttribute('class')=='currents'){
                                    while(i+1<tabs.length){
                                        let nextTab= tabs[i+1].parentNode;
                                        if((nextTab.innerHTML.includes('roundpoint  blue')&&_w.top.unrivalReviewMode=='0')||nextTab.innerHTML.includes('roundpointStudent  lock')){
                                            i++;
                                            continue;
                                        }
                                        if(nextTab.id.indexOf('cur')<0){
                                            i++;
                                            continue;
                                        }
                                        let clickF = setInterval(function(){
                                            if(rd!=_w.top.unrivalPageRd){
                                                clearInterval(clickF);
                                                return;
                                            }
                                            nextTab.click();
                                        },2000);
                                        break;
                                    }
                                    break;
                                }
                            }
                        }
                    },2000);
                }catch(e){
                }
            }
            _w.onReadComplete1();
            setTimeout('jjump("'+_w.top.unrivalPageRd+'")',2856);
        }
    },200);
}else if(_l.href.indexOf("work/phone/doHomeWork") >0){
    var allow = true,
        wIdE = _d.getElementById('workLibraryId')||_d.getElementById('oldWorkId'),
        wid = wIdE.value;
    _w.top.unrivalWorkDone = false;
    _w.aalert = _w.alert;
    _w.alert=(msg)=>{
        if(msg=='保存成功'){
            _w.top.unrivalDoneWorkId=getQueryVariable('workId');
            return;
        }
        aalert(msg);
    }
    if(_w.top.unrivalDoneWorkId==getQueryVariable('workId')){
        _w.top.unrivalWorkDone = true;
        return;
    }
    _w.cconfirm = _w.confirm;
    _w.confirm=(msg)=>{
        if(msg=='确认提交？'||msg.includes('您还有未做完的')){
            return true;
        }
        _w.cconfirm(msg);
    }
    var questionList = [],
        questionsElement = _d.getElementsByClassName('Py-mian1'),
        questionNum = questionsElement.length,
        totalQuestionNum = questionNum;
    for(let i=0;i<questionNum;i++){
        let questionElement = questionsElement[i],
            title = questionElement.getElementsByClassName('Py-m1-title fs16')[0].innerHTML.replace(/(<([^>]+)>)/ig, "").replace(/[0-9]{1,3}.\[(.*?)\]/ig,''),
            idElements = questionElement.getElementsByTagName('input'),
            questionId = '0';
        for(let z=0,k=idElements.length;z<k;z++){
            try{
                if(idElements[z].getAttribute('name').indexOf('answer')>=0){
                    questionId = idElements[z].getAttribute('name').replace('type','');
                    break;
                }
            }catch(e){
                console.log(e);
                continue;
            }
        }
        let question = title;
        if(questionId=='0'||question==''){
            continue;
        }
        typeE = questionElement.getElementsByTagName('input');
        if(typeE==null||typeE==[]){
            continue;
        }
        let typeN = 'fuckme';
        for(let g=0,h=typeE.length;g<h;g++){
            if(typeE[g].id=='answertype'+questionId.replace('answer','').replace('check','')){
                typeN = typeE[g].value;
                break;
            }
        }
        if(['0','1','3'].indexOf(typeN)<0){
            continue;
        }
        type={'0':'单选题','1':'多选题','3':'判断题'}[typeN];
        let optionList = {
            length:0
        };
        if(['单选题','多选题'].indexOf(type)>=0){
            let answersElements = questionElement.getElementsByClassName('answerList')[0].getElementsByTagName('li');
            for(let x=0,j=answersElements.length;x<j;x++){
                let optionE = answersElements[x],
                    sample = /(<([^>]+)>)/ig,
                    optionTextE = optionE.innerHTML.replace(sample, "").replace(/(^\s*)|(\s*$)/g, ""),
                    optionText = optionTextE.slice(1).replace(/(^\s*)|(\s*$)/g, ""),
                    optionValue = optionTextE.slice(0,1),
                    optionId = optionE.getAttribute('id-param');
                if(optionText==''){
                    break;
                }
                optionList[optionText]={
                    'id':optionId,
                    'value':optionValue
                }
                optionList.length++;
            }
            if(answersElements.length!=optionList.length){
                continue;
            }
        }
        questionList.push({
            'question':question,
            'type':type,
            'questionid':questionId,
            'options':optionList
        });
    }
    var nowTime=-2000,
        busyThread = questionList.length;
    for(let i=0,l=questionList.length;i<l;i++){
        nowTime+=parseInt(Math.random()*2000+2000,10);
        let qu = questionList[i];
        setTimeout(function(){
            if(!allow){
                _w.top.unrivalWorkInfo = '暂时无法作答此题';
                return;
            }
            let param = 'tm=' + encodeURIComponent(qu['question']) + '&question=' + encodeURIComponent(qu['question']);
            if(ctUrl.includes('icodef')){
                param += '&type=' + {'单选题':'0','多选题':'1','判断题':'3'}[qu['type']]+'&id='+wid;
            }
            GM_xmlhttpRequest({
                method: "POST",
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                url:ctUrl,
                data: param,
                onload: function(res) {
                    if(!allow){
                        _w.top.unrivalWorkInfo = '暂时无法作答此题';
                        return;
                    }
                    busyThread-=1;
                    try{

                        let choiceEs = _d.getElementsByTagName('li'),
                            responseText = res.responseText;
                        try{
                            var result = responseText.match(/"answer"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"answer"[\s]*:[\s]*"/ig,'').slice(0,-1);
                        }catch(e){
                            try{
                                var result = responseText.match(/"data"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"data"[\s]*:[\s]*"/ig,'').slice(0,-1);
                            }catch(e){
                                try{
                                    var result = responseText.match(/"result"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"result"[\s]*:[\s]*"/ig,'').slice(0,-1);
                                }catch(e){
                                    try{
                                        var result = responseText.match(/"msg"[\s]*:[\s]*"(.*?)"/ig)[0].replace(/"msg"[\s]*:[\s]*"/ig,'').slice(0,-1);
                                    }catch(e){
                                        try{
                                            var result = responseText.match(/:[\s]*"(.*?)"/ig)[0].replace(/:[\s]*"/ig,'').slice(0,-1);
                                        }catch(e){
                                            _w.top.unrivalWorkInfo = '答案解析失败';
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                        _w.top.unrivalWorkInfo = '题目：'+qu['question']+'：'+result;
                        switch(qu['type']){
                            case '判断题':(function(){
                                let answer = 'abaabaaba';
                                if('正确是对√Tri'.indexOf(result)>=0){
                                    answer = 'true';
                                }else if('错误否错×Fwr'.indexOf(result)>=0){
                                    answer = 'false';
                                }
                                for(let u=0,k=choiceEs.length;u<k;u++){
                                    if(choiceEs[u].getAttribute('val-param')==answer&&choiceEs[u].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                        choiceEs[u].click();
                                        questionNum-=1;
                                        return;
                                    }
                                }
                                if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动选【错】';
                                    for(let u=0,k=choiceEs.length;u<k;u++){
                                        if(choiceEs[u].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[u].getAttribute('val-param')=='false'&&choiceEs[u].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            choiceEs[u].click();
                                            return;
                                        }
                                    }
                                }
                            })();
                            break;
                            case '单选题':(function(){
                                let answerData = result;
                                for(let option in qu['options']){
                                    if(trim(option)==trim(answerData)||trim(option).includes(trim(answerData))||trim(answerData).includes(trim(option))){
                                        for(let y=0,j=choiceEs.length;y<j;y++){
                                            if(choiceEs[y].getElementsByTagName('em').length<1){
                                                continue;
                                            }
                                            if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')==qu['options'][option]['value']&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                                if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                    choiceEs[y].click();
                                                }
                                                questionNum-=1;
                                                return;
                                            }
                                        }
                                    }
                                }
                                if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动选【B】';
                                    for(let y=0,j=choiceEs.length;y<j;y++){
                                        if(choiceEs[y].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')=='B'&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                choiceEs[y].click();
                                            }
                                            return;
                                        }
                                    }
                                }
                            })();
                            break;
                            case '多选题':(function(){
                                let answerData = result,
                                    hasAnswer = false;
                                for(let option in qu['options']){
                                    if(answerData.indexOf(trim(option))>=0){
                                        for(let y=0,j=choiceEs.length;y<j;y++){
                                            if(choiceEs[y].getElementsByTagName('em').length<1){
                                                continue;
                                            }
                                            if(choiceEs[y].getElementsByTagName('em')[0].getAttribute('id-param')==qu['options'][option]['value']&&choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                                if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                    choiceEs[y].click();
                                                }
                                                hasAnswer = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                                if(hasAnswer){
                                    questionNum-=1;
                                }else if(randomDo==1&&accuracy<100){
                                    _w.top.unrivalWorkInfo = qu['question']+'：未找到正确答案，自动全选';
                                    for(let y=0,j=choiceEs.length;y<j;y++){
                                        if(choiceEs[y].getElementsByTagName('em').length<1){
                                            continue;
                                        }
                                        if(choiceEs[y].getAttribute('id-param')==qu['questionid'].replace('answer','')){
                                            if(!choiceEs[y].getAttribute('class').includes('cur')){
                                                choiceEs[y].click();
                                            }
                                        }
                                    }
                                }
                            })();
                            break;
                        }    
                    }catch(e){
                        if(res.responseText.length<50){
                            _w.top.unrivalWorkInfo = qu['question']+':'+res.responseText;
                        }
                        console.log(e);
                    }
                },
                onerror:function(err){
                    _w.top.unrivalWorkInfo = '查题错误，服务器连接失败';
                    console.log(err);
                    busyThread-=1;
                }
            });
        },nowTime);
    }
    var workInterval = setInterval(function(){
        if(busyThread!=0){
            return;
        }
        clearInterval(workInterval);
        if(Math.floor((totalQuestionNum-questionNum)/totalQuestionNum)*100>=accuracy&&_w.top.unrivalAutoSubmit=='1'){
            _w.top.unrivalDoneWorkId=getQueryVariable('workId');
            _w.top.unrivalWorkInfo = '正确率符合标准，已提交答案';
            setTimeout(function(){
                submitCheckTimes();
            },parseInt(Math.random()*2000+3000,10));
        }else if(_w.top.unrivalAutoSave==1){
            _w.top.unrivalWorkInfo = '正确率不符合标准或未设置自动提交，已自动保存答案';
            setTimeout(function(){
                _w.top.unrivalDoneWorkId=getQueryVariable('workId');
                _w.noSubmit();
            },2000);
        }else{
            _w.top.unrivalWorkInfo = '用户设置为不自动保存答案，请手动提交或保存作业';
        }
    },1000);
}else if(_l.href.includes('work/phone/selectWorkQuestionYiPiYue')){
    _w.top.unrivalWorkDone = true;
    _w.top.unrivalDoneWorkId = getQueryVariable('workId');
}else if(_l.href.includes('stat2-ans.chaoxing.com/task/s/index')){
    if(_w.top==_w){
        return;
    }
    _d.getElementsByClassName('page-container studentStatistic')[0].setAttribute('class','studentStatistic');
    _d.getElementsByClassName('page-item item-task-list minHeight390')[0].remove();
    _d.getElementsByClassName('subNav clearfix')[0].remove();
    setInterval(function(){
        _l.reload();
    },90000);
}else if(_l.href.includes('passport2.')&&_l.href.includes('login?refer=http')&&autoLogin==1){
    if(!(/^1[3456789]\d{9}$/.test(phoneNumber))){
        alert('自动登录的手机号填写错误，无法登陆')
        return;
    }
    if(password==''){
        alert('未填写登录密码，无法登陆')
        return;
    }
    GM_xmlhttpRequest({
        method: "get",
        url: 'https://passport2-api.chaoxing.com/v11/loginregister?cx_xxt_passport=json&uname='+phoneNumber+'&code='+encodeURIComponent(password),
        onload: function(res) {
            try{
                let ispass = JSON.parse(res.responseText);
                if(ispass['status']){
                    _l.href=decodeURIComponent(getQueryVariable('refer'));
                }else{
                    alert(ispass['mes']);
                }
            }catch(err){
                console.log(res.responseText);
                alert('登陆失败');
            }
        },
        onerror:function(err){
            alert('登陆错误');      
        }
    });
}

//考试答题
var kaoshi = window.location.hostname + window.location.pathname;
if(kaoshi == kaoshiUrl){
setting.notice = '公告栏';
String.prototype.toCDB = function() {
    return this.replace(/\s/g, '').replace(/[\uff01-\uff5e]/g, function(str) {
        return String.fromCharCode(str.charCodeAt(0) - 65248);
    }).replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/。/g, '.');
};
 
// setting.time += Math.ceil(setting.time * Math.random()) - setting.time / 2;
setting.TiMu = [
    filterImg('.Cy_TItle .clearfix').replace(/\s*（\d+\.\d+分）$/, ''),
    $('[name^=type]:not([id])').val() || '-1',
    $('.cur a').text().trim() || '无',
    $('li .clearfix').map(function() {
        return filterImg(this);
    })
];
var maximize=$(
    '<div style="border: 2px dashed rgb(0, 85, 68); position: fixed; top: 0; right: 0; z-index: 99999; background-color: rgba(70, 196, 38, 0.6); overflow-x: auto;display:none;">◻</div>'
).appendTo('body').click(function(){
    $(setting.div).css("display","block");
    GM_setValue("minimize","0");
    $(maximize).css("display","none");
});
 
setting.div = $(
    '<div style="border: 2px dashed rgb(0, 85, 68); width: 330px; position: fixed; top: 0; right: 0; z-index: 99999; background-color: rgba(70, 196, 38, 0.6); overflow-x: auto;">' +
    '<span style="font-size: medium;"></span>' +
    '<div style="font-size: medium;width:70%;display: inline-block;">正在搜索答案...</div>'+
    '<div style="width:30%;display: inline-block;padding-right: 10px;box-sizing: border-box;text-align: right;"><minimize style="width:20px;font-size:16px;line-height: 12px;font-weight: bold;cursor: context-menu;user-select:none;">一</minimize></div>' +
    '<div id="cx-notice" style="border-top: 1px solid #000;border-bottom: 1px solid #000;margin: 4px 0px;overflow: hidden;">' + setting.notice + '</div>' +
    '<button style="margin-right: 10px;">暂停答题</button>' +
    '<button style="margin-right: 10px;' + (setting.jump ? '' : ' display: none;') + '">点击停止本次切换</button>' +
    '<button style="margin-right: 10px;">重新查询</button>' +
    '<button style="margin-right: 10px; display: none;">复制答案</button>' +
    '<button>答题详情</button>' +
    '<div style="max-height: 200px; overflow-y: auto;">' +
    '<table border="1" style="font-size: 12px;">' +
    '<thead>' +
    '<tr>' +
    '<th colspan="2">' + ($('#randomOptions').val() == 'false' ? '' : '<font color="red">本次考试的选项为乱序 脚本会选择正确的选项</font>') + '</th>' +
    '</tr>' +
    '<tr>' +
    '<th style="width: 60%; min-width: 130px;">题目（点击可复制）</th>' +
    '<th style="min-width: 130px;">答案（点击可复制）</th>' +
    '</tr>' +
    '</thead>' +
    '<tfoot style="' + (setting.jump ? ' display: none;' : '') + '">' +
    '<tr>' +
    '<th colspan="2">已关闭 本次自动切换</th>' +
    '</tr>' +
    '</tfoot>' +
    '<tbody>' +
    '<tr>' +
    '<td colspan="2" style="display: none;"></td>' +
    '</tr>' +
    '</tbody>' +
    '</table>' +
    '</div>' +
    '</div>'
).appendTo('body').on('click', 'button, td', function() {
    var num = setting.$btn.index(this);
    if (num == -1) {
        GM_setClipboard($(this).text());
    } else if (num === 0) {
        if (setting.loop) {
            clearInterval(setting.loop);
            delete setting.loop;
            num = ['已暂停搜索', '继续答题'];
        } else {
            setting.loop = setInterval(findTiMu, setting.time);
            num = ['正在搜索答案...', '暂停答题'];
        }
        setting.$div.html(function() {
            return $(this).data('html') || num[0];
        }).removeData('html');
        $(this).html(num[1]);
    } else if (num == 1) {
        setting.jump = 0;
        setting.$div.html(function() {
            return arguments[1].replace('即将切换下一题', '未开启自动切换');
        });
        setting.div.find('tfoot').add(this).toggle();
    } else if (num == 2) {
        location.reload();
    } else if (num == 3) {
        GM_setClipboard(setting.div.find('td:last').text());
    } else if (num == 4) {
        ($('.leftCard .saveYl')[0] || $()).click();
    } else if (num == 5) {
        setting.tk_num++;
        GM_setValue('tk_num_1',setting.tk_num);
        setting.tk_num = GM_getValue('tk_num_1');
        console.log(setting.tk_num);
        parent.location.reload();
    }
}).on('click','minimize', function() {
    $(this).parent().parent().css("display","none");
    GM_setValue("minimize","1");
    $(maximize).css("display","block");
}).detach(setting.hide ? '*' : 'html');
 
if(GM_getValue("minimize")=="1"){
    $(setting.div).css("display","none");
    $(maximize).css("display","block");
}
 
setting.$btn = setting.div.children('button');
setting.$div = setting.div.children('div:eq(0)');
 
$(document).keydown(function(event) {
    if (event.keyCode == 38) {
        setting.div.detach();
    } else if (event.keyCode == 40) {
        setting.div.appendTo('body');
    }
});
 
if (setting.scale) _self.UEDITOR_CONFIG.scaleEnabled = false;
$.each(UE.instants, function() {
    var key = this.key;
    this.ready(function() {
        this.destroy();
        UE.getEditor(key);
    });
});
setting.loop = setInterval(findTiMu, setting.time);
 
 
function fillAnswer(obj, tip) {
    var $input = $(':radio, :checkbox', '.Cy_ulBottom'),
        str = String(obj.answer).toCDB() || new Date().toString(),
        data = str.split(/#|\x01|\|/),
        opt = obj.opt || str,
        btn = $('.saveYl:contains(下一题)').offset();
    // $input.filter(':radio:checked').prop('checked', false);
    obj.code > 0 && $input.each(function(index) {
        if (this.value == 'true') {
            data.join().match(/(^|,)(正确|是|对|√|T|ri)(,|$)/) && this.click();
        } else if (this.value == 'false') {
            data.join().match(/(^|,)(错误|否|错|×|F|wr)(,|$)/) && this.click();
        } else {
            index = setting.TiMu[3][index].toCDB() || new Date().toString();
            index = $.inArray(index, data) + 1 || (setting.TiMu[1] == '1' && str.indexOf(index) + 1);
            Boolean(index) == this.checked || this.click();
        }
    }).each(function() {
        if (!/^A?B?C?D?E?F?G?$/.test(opt)) return false;
        Boolean(opt.match(this.value)) == this.checked || this.click();
    });
    if (setting.TiMu[1].match(/^[013]$/)) {
        tip = $input.is(':checked') || setting.none && (($input[Math.floor(Math.random() * $input.length)] || $()).click(), ' ');
    } else if (setting.TiMu[1].match(/^(2|[4-9]|1[08])$/)) {
        data = String(obj.answer).split(/#|\x01|\|/);
        tip = $('.Cy_ulTk textarea').each(function(index) {
            index = (obj.code > 0 && data[index]) || '';
            UE.getEditor(this.name).setContent(index.trim());
        }).length;
        tip = (obj.code > 0 && data.length == tip) || setting.none && ' ';
        setting.len = str.length * setting.time / 10;
    }
    if (tip == ' ') {
        tip = '已执行默认操作';
    } else if (tip) {
        tip = '自动答题已完成';
    } else if (tip === undefined) {
        tip = '该题型不支持自动答题';
    } else {
        tip = '未找到有效答案';
    }
    if (btn) {
        tip += setting.jump ? '，即将切换下一题' : '，未开启自动切换';
        setInterval(function() {
            if (!setting.jump) return;
            var mouse = document.createEvent('MouseEvents'),
                arr = [btn.left + Math.ceil(Math.random() * 80), btn.top + Math.ceil(Math.random() * 26)];
            mouse.initMouseEvent('click', true, true, document.defaultView, 0, 0, 0, arr[0], arr[1], false, false, false, false, 0, null);
            _self.event = $.extend(true, {}, mouse);
            delete _self.event.isTrusted;
            _self.getTheNextQuestion(1);
        }, setting.len || Math.ceil(setting.time * Math.random()) * 2);
    } else {
        setting.$btn.eq(1).hide();
        tip = '答题已完成，请自行查看答题详情';
    }
    setting.$div.data('html', tip).siblings('button:eq(0)').hide().click();
}
 
function findTiMu() {
    GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://cx.icodef.com/wyn-nb?v=2',
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        },
        data: 'question=' + encodeURIComponent(setting.TiMu[0]) + '&type=' + setting.TiMu[1] + '&id=' + $('#paperId').val(),
        timeout: setting.time,
        onload: function(xhr) {
            if (!setting.loop) {
            } else if (xhr.status == 200) {
                var obj = $.parseJSON(xhr.responseText) || {};
                obj.answer = obj.data;
                if (obj.code) {
                    var answer = String(obj.answer).replace(/&/g, '&amp;').replace(/<(?!img)/g, '&lt;'),
                        que = setting.TiMu[0].match('<img') ? setting.TiMu[0] : setting.TiMu[0].replace(/&/g, '&amp;').replace(/</g, '&lt');
                    obj.answer = /^http/.test(answer) ? '<img src="' + obj.answer + '">' : obj.answer;
                    setting.div.find('tbody').append(
                        '<tr>' +
                        '<td title="点击可复制">' + que + '</td>' +
                        '<td title="点击可复制">' + (/^http/.test(answer) ? obj.answer : '') + answer + '</td>' +
                        '</tr>'
                    );
                    setting.copy && GM_setClipboard(obj.answer);
                    setting.$btn.eq(3).show();
                    fillAnswer(obj);
                } else {
                    setting.$div.html(obj.answer || '服务器繁忙，正在重试...');
                }
                setting.div.children('span').html(obj.msg || '');
            } else if (xhr.status == 403) {
                var html = xhr.responseText.indexOf('{') ? '请求过于频繁，建议稍后再试' : $.parseJSON(xhr.responseText).data;
                setting.$div.data('html', html).siblings('button:eq(0)').click();
            } else {
                setting.$div.text('服务器异常，正在重试...');
            }
        },
        ontimeout: function() {
            setting.loop && setting.$div.text('服务器超时，正在重试...');
        }
    });
 
}
function filterImg(dom) {
    return $(dom).clone().find('img[src]').replaceWith(function() {
        return $('<p></p>').text('');
    }).end().find('iframe[src]').replaceWith(function() {
        return $('<p></p>').text('');
    }).end().text().trim();
}

}

function md5(string,bit) {
    function md5_RotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function md5_AddUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }
    function md5_F(x, y, z) {
        return (x & y) | ((~x) & z);
    }
    function md5_G(x, y, z) {
        return (x & z) | (y & (~z));
    }
    function md5_H(x, y, z) {
        return (x ^ y ^ z);
    }
    function md5_I(x, y, z) {
        return (y ^ (x | (~z)));
    }
    function md5_FF(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    };
    function md5_GG(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    };
    function md5_HH(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    };
    function md5_II(a, b, c, d, x, s, ac) {
        a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
        return md5_AddUnsigned(md5_RotateLeft(a, s), b);
    };
    function md5_ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    };
    function md5_WordToHex(lValue) {
        var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    };
    function md5_Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    var S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    string = md5_Utf8Encode(string);
    x = md5_ConvertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = md5_AddUnsigned(a, AA);
        b = md5_AddUnsigned(b, BB);
        c = md5_AddUnsigned(c, CC);
        d = md5_AddUnsigned(d, DD);
    }
    if(bit==32){
        return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
    }
    return (md5_WordToHex(b) + md5_WordToHex(c)).toLowerCase();
}
})();
