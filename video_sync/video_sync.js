// ==UserScript==
// @name         视频同步助手
// @namespace    caiguang1997
// @version      1.2
// @description  视频同步助手（测试版本，请勿下载）
// @author       caiguang1997
// @include      *
// @include      file://*
// @exclude      *message.bilibili.com*
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

const me_email = "2240726829@qq.com";
const ta_email = "1119230564@qq.com";
// const me_email = "1119230564@qq.com";
// const ta_email = "2240726829@qq.com";

var access_token = "b3d23a312114fc5c3f8a8356dc1efaf5";

var me_setting = new SettingInit();
var ta_setting = new SettingInit();

var timer = null;
var come_in_times = 0;
var is_mouse_move = false;
var is_mouse_enter = false;
var button_opacity = 1;
var file_content = "";

// Microphone Detect
var origin_volume = 0.5;
var specific_volume = 0.2;
var use_specific_volume = false;
var start_time = 0;    //持续时间
var recorder = null;

// 同步信息设置
function sync_setting_onclick(element) {
    var style = document.querySelector("#video_sync_setting_fieldset").getAttribute("style");
    if(element.innerHTML==='展开设置&gt;&gt;'){
        element.innerHTML = '折叠设置&lt;&lt;'
        style = style.replace("display: none;", "display: block;");
        document.querySelector("#video_sync_setting_fieldset").setAttribute("style", style);
        // me_setting.user_email = prompt("我的邮箱：", me_setting.user_email);
        // ta_setting.user_email = prompt("TA的邮箱：", ta_setting.user_email);
        // create_user_by_email(setting);
    }
    else {
        element.innerHTML = "展开设置&gt;&gt;";
        style = style.replace("display: block;", "display: none;");
        document.querySelector("#video_sync_setting_fieldset").setAttribute("style", style);
    }
}

function email_onchange(element) {
    console.log('email_onchange');
    const id = element.getAttribute("id");
    if(id==="id_video_sync_me_email") {
        me_setting.user_email = element.value;
        search_gist_by_email(me_setting);
    }
    else {
        ta_setting.user_email = element.value;
        search_gist_by_email(ta_setting);
    }
}

function startMicrophoneDetect() {
    // if(document.querySelector('video') && navigator.userAgent.search('Windows')>0) {// 讲话时视频音量减小
    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let mediaStreamSource = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 获取用户的media信息
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            // 将麦克风的声音输入这个对象
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            // 创建一个音频分析对象，采样的缓冲区大小为4096，输入和输出都是单声道
            recorder = audioContext.createScriptProcessor(4096, 1, 1);
            // 将该分析对象与麦克风音频进行连接
            mediaStreamSource.connect(recorder);
            // 此举无甚效果，仅仅是因为解决 Chrome自身的 bug
            recorder.connect(audioContext.destination);

            // 开始处理音频
            recorder.onaudioprocess = function (e) {
                // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
                let buffer = e.inputBuffer.getChannelData(0);
                // 获取缓冲区中最大的音量值
                let maxVal = Math.max.apply(Math, buffer);
                if (maxVal > 0.1) {
                    // 声音大于一定值
                    if (use_specific_volume === false) origin_volume = document.querySelector('video').volume;
                    use_specific_volume = true;  //todo:对方是否有声音
                    start_time = new Date();
                }

                if (use_specific_volume) {
                    specific_volume = 0.5 * origin_volume * origin_volume;
                    document.querySelector('video').volume = specific_volume;
                    if (new Date() - start_time > 1500) {
                        use_specific_volume = false;
                        document.querySelector('video').volume = origin_volume;
                    }
                }

                // 显示音量值
                // console.log('您的音量值：' + Math.round(maxVal * 100));
            };
        }).catch((error) => {
            console.log('获取音频时好像出了点问题' + error);
        })
    } else {
        console.log('不支持获取媒体接口');
    }
}
// }

function stopMicrophoneDetect() {
    if(recorder!==null) recorder.disconnect();
}

function microphone_onchange(checkbox) {
    if(checkbox.checked===true){
        startMicrophoneDetect();
    }
    else{
        stopMicrophoneDetect();
    }
}

// 观看本地视频
function watch_local_video() {
    const gist = "te8hxbol9rasy65ci3vjg50";

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var my_html = JSON.parse(this.responseText)["files"]["watch_local_video.html"]["content"];
            document.open();
            document.write(my_html)
            document.close();
            createMenu(); //创建按键
        }
    });

    xhr.open("GET", "https://gitee.com/api/v5/gists/" + gist + "?access_token=" + access_token);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();
}

function video_sync_explain_onclick(element) {
    var style = document.querySelector("#video_sync_explain_fieldset").getAttribute("style");
    if(element.innerHTML==='展开说明&gt;&gt;'){
        element.innerHTML = '折叠说明&lt;&lt;'
        style = style.replace("display: none;", "display: block;");
        document.querySelector("#video_sync_explain_fieldset").setAttribute("style", style);
    }
    else {
        element.innerHTML = "展开说明&gt;&gt;";
        style = style.replace("display: block;", "display: none;");
        document.querySelector("#video_sync_explain_fieldset").setAttribute("style", style);
    }
}

// 创建菜单界面
function createMenu() {
    if(document.querySelector("#video_sync_menu")!==null) return;

    var main_menu = document.createElement('div');
    main_menu.setAttribute("id", "video_sync_menu");
    // main_menu.setAttribute("style", "display: none; opacity: 0;");   //正常使用
    main_menu.setAttribute("style", "display: block; opacity: 1;");  //调试使用
    main_menu.setAttribute("style", "position: fixed; top: 35%; right: 1%; width: 300px; display: block; opacity: 1; cursor: pointer; z-index:2147483647;");

    main_menu.innerHTML =
        '<button id="video_sync_with_ta" onclick="sync_with_ta()" ' +
        'style="background-color: #4CAF50; color: white; width: 160px; height: 30px; -webkit-border-radius: 8px;' +
        'padding: 2px 2px 2px 5px; box-sizing: border-box; margin: 0 3px; float: left; outline: none;"' +
        '>与TA同步（未登录）</button>' +
        '<br /><br />'+
        '<button id="video_sync_with_me" onclick="sync_with_me()" ' +
        'style="background-color: #4CAF50; color: white; width: 160px; height: 30px; -webkit-border-radius: 8px;' +
        'padding: 2px 2px 2px 5px; box-sizing: border-box; margin: 0 3px; float: left; outline: none;"' +
        '>与我同步 00:00:00</button>' +
        '<br /><br />' +
        '<button id="video_sync_setting" onclick="sync_setting_onclick(this)" ' +
        'style="background-color: #4CAF50; color: white; width: 160px; height: 30px; -webkit-border-radius: 8px;' +
        'padding: 2px 2px 2px 5px; box-sizing: border-box; margin: 0 3px; float: left; outline: none;"' +
        '>展开设置&gt;&gt;</button>' +
        '<fieldset id="video_sync_setting_fieldset" style="margin: 2px; display: block; background-color: #F2F2F7; list-style: none; -webkit-border-radius: 4px; ">' +
        '<legend style="font-weight: bold">设置</legend>' +
        '<li><input id="video_sync_microphone" type="checkbox" value="off" onchange="microphone_onchange(this)">对话时降视频音量（建议戴耳机）</input></li>' +
        '<li><input id="id_video_sync_me_email" onchange="email_onchange(this)" type="input" value="" style="width: 140px;" placeholder="执子之手@love.com"/><label> ←我的邮箱</label></li>' +
        '<li><input id="id_video_sync_ta_email" onchange="email_onchange(this)" type="input" value="" style="width: 140px;" placeholder="与子偕老@forever.com"/><label> ←TA的邮箱</label></li>' +
        '<li><label id="video_sync_explain" style="color: blue;" onclick="video_sync_explain_onclick(this)">折叠说明&lt;&lt;</label></li>' +
        '<fieldset id="video_sync_explain_fieldset" style="display: block; font-size: small; color: red; list-style: -moz-ethiopic-numeric;">' +
        '<li><label>初衷：祝有情人终成眷属</label></li>'+
        '<li><label>声明：本软件不采集或侵犯任何隐私</label></li>'+
        '<li><label>适用：跨平台，部分功能IOS不可用</label></li>'+
        '<li><label>联系：1119230564@qq.com</label></li>'+
        '<li><label>打赏：支付宝或微信17766589114</label></li>'+
        '</fieldset>' +
        '<button style="position: relative; float: left;" onclick="watch_local_video()">观看本地视频</button>' +
        '<button style="position: relative; float: right;" onclick="">保存配置</button>' +
        '</fieldset>';

    document.querySelector("body").appendChild(main_menu); //创建按键
    document.querySelector("body").onmousemove = function () {is_mouse_move = true;};
    document.querySelector("#video_sync_menu").onmouseenter = function () {is_mouse_enter = true;};
    document.querySelector("#video_sync_menu").onmouseleave = function () {is_mouse_enter = false;};
    document.querySelector("#id_video_sync_me_email").value = me_setting.user_email;
    document.querySelector("#id_video_sync_ta_email").value = ta_setting.user_email;
}

// 初始化数据
function SettingInit() {
    this.user_email = "null";
    this.request_sync = "null";
    this.video_link = "null";
    this.video_paused = "null";
    this.video_speed = "null";
    this.episode = "null";
    this.sync_time = "null";

    //不在json内：
    this.updated_at = "null";
    this.gist = "null";
}

//获取用户连接
function search_gist_by_email(setting) {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var contain = JSON.parse(this.responseText);
            for(var i=0;i<contain.length;i++) {
                if(contain[i].description===setting.user_email) {
                    setting.gist = contain[i].url.replace('https://gitee.com/api/v5/gists/','');
                    return;
                }
            }
            // alert("该邮箱不存在，重新输入或创建");
            // TODO:该邮箱不存在，重新输入或创建
        }
    });

    xhr.open("GET", "https://gitee.com/api/v5/gists?access_token=" + access_token + "&page=1&per_page=20");
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();
}

//创建用户
function create_user_by_email(setting) {
    alert("create_user_by_email");
}

//获取服务器配置
function get_setting(setting) {
    if(setting.gist!==""&&setting.email!==""&&setting.gist!==null&&setting.email!==null) {
        var xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                if (this.responseText.search(setting.user_email) !== -1) {
                    this.updated_at = JSON.parse(this.responseText)["updated_at"];
                    file_content = JSON.parse(this.responseText)["files"][setting.user_email]["content"];        //更新content
                    if (file_content.search("user_email") !== -1) {
                        // setting.user_email = file_content.match(new RegExp("\\[user_email\\](.*)\\[\/user_email\\]"))[1];
                        setting.request_sync = file_content.match(new RegExp("\\[request_sync\\](.*)\\[\/request_sync\\]"))[1];
                        setting.video_link = file_content.match(new RegExp("\\[video_link\\](.*)\\[\/video_link\\]"))[1];
                        // setting.video_link = location.href;
                        setting.video_paused = file_content.match(new RegExp("\\[video_paused\\](.*)\\[\/video_paused\\]"))[1];
                        setting.video_speed = file_content.match(new RegExp("\\[video_speed\\](.*)\\[\/video_speed\\]"))[1];
                        setting.episode = file_content.match(new RegExp("\\[episode\\](.*)\\[\/episode\\]"))[1];
                        if (new Date() - new Date(this.updated_at) > 5000) setting.sync_time = "null";   // 时差超过5s视为离线
                        else setting.sync_time = file_content.match(new RegExp("\\[sync_time\\](.*)\\[\/sync_time\\]"))[1];
                    }
                } else {
                    console.log("get_setting(setting) fail")
                    console.log(this.responseText);
                }
            }
        });

        xhr.open("GET", "https://gitee.com/api/v5/gists/" + setting.gist + "?access_token=" + access_token);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send();
    }
}

//修改服务器配置
function set_setting(setting) {
    if(setting.gist!==""&&setting.email!==""&&setting.gist!==null&&setting.email!==null) {
        var data = "{\"access_token\":\"" + access_token + "\",\"files\":{\"" + setting.user_email + "\":{\"content\":\"" + file_content + "\"}},\"description\":\"" + setting.user_email + "\",\"public\":\"false\"}";
        data = data.replace(new RegExp("\r\n", "g"), "\\r\\n");
        data = data.replace(new RegExp("\\[user_email\\].*\\[\/user_email\\]"), "[user_email]" + setting.user_email + "[/user_email]");
        data = data.replace(new RegExp("\\[request_sync\\].*\\[\/request_sync\\]"), "[request_sync]" + setting.request_sync + "[/request_sync]");
        data = data.replace(new RegExp("\\[video_link\\].*\\[\/video_link\\]"), "[video_link]" + setting.video_link + "[/video_link]");
        data = data.replace(new RegExp("\\[video_paused\\].*\\[\/video_paused\\]"), "[video_paused]" + setting.video_paused + "[/video_paused]");
        data = data.replace(new RegExp("\\[video_speed\\].*\\[\/video_speed\\]"), "[video_speed]" + setting.video_speed + "[/video_speed]");
        data = data.replace(new RegExp("\\[episode\\].*\\[\/episode\\]"), "[episode]" + setting.episode + "[/episode]");
        data = data.replace(new RegExp("\\[sync_time\\].*\\[\/sync_time\\]"), "[sync_time]" + setting.sync_time + "[/sync_time]");

        var xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                me_setting.request_sync = "false";
                come_in_times++;
                if (come_in_times > 2) {
                    if (this.responseText.search("Access token does not exist") >= 0) {
                        access_token = prompt("请输入有效的token或禁用本插件", access_token);
                        localStorage.access_token = access_token;
                    } else if (this.responseText.search('Gist') >= 0) {
                        console.log(this.responseText)
                        // setting.email = prompt("无效邮箱，请输入有效邮箱", setting.email);
                        // create_user_by_email(setting);
                    } else if (this.responseText.search("user_email") !== -1) {
                        console.log("set server setting successfully!");
                    } else {
                        console.log(this.responseText);
                    }
                }
            }
        });

        xhr.open("PATCH", "https://gitee.com/api/v5/gists/" + setting.gist);
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        xhr.send(data);
    }
}

// 与我同步
function sync_with_me() {
    me_setting.request_sync = "true";
    me_setting.video_link = location.href;
    me_setting.video_paused = document.querySelector('video').paused + "";
    me_setting.video_speed = document.querySelector('video').playbackRate + "";
    // me_setting.episode = document.querySelector("#eplist_module > div.list-wrapper.simple > ul > li.ep-item.cursor.badge.visited").innerText.match(/\d*/)[0];
    me_setting.sync_time = document.querySelector('video').currentTime + "";
    set_setting(me_setting);
}

// 与对方同步
function sync_with_ta() {
    const time_offset = 1;//视频缓冲时的时间补偿
    if(ta_setting.sync_time!=="null") {
        //同步时间并同步开始暂停
        if(ta_setting.video_paused==="true") {
            document.querySelector('video').currentTime = ta_setting.sync_time*1;
            document.querySelector('video').pause();
        }
        else {
            document.querySelector('video').currentTime = ta_setting.sync_time*1 + time_offset;
            document.querySelector('video').play();
        }

        //TODO：同步播放速度、链接、集数、同步弹幕
        console.log("对方时间：" + ta_setting.sync_time);
    }
}

//接收同步配置
function timer_callback() {
    get_setting(ta_setting);
    if(ta_setting.request_sync==="true") sync_with_ta();
    me_setting.video_paused = document.querySelector('video').paused + "";
    me_setting.sync_time = document.querySelector('video').currentTime;
    set_setting(me_setting);

    // 修改menu显示时间
    var seconds;
    var minutes;
    var hours;
    var total_seconds;

    total_seconds = Math.round(me_setting.sync_time);
    seconds = total_seconds%60;
    if(seconds<10) seconds="0"+seconds;
    minutes = (total_seconds-seconds)/60%60;
    if(minutes<10) minutes="0"+minutes;
    hours = (total_seconds-seconds-minutes*60)/3600;
    if(hours<10) hours="0"+hours;
    document.querySelector("#video_sync_with_me").innerHTML = "与我同步 "+hours+":"+minutes+":"+seconds;

    if(ta_setting.sync_time!=="null"){
        total_seconds = Math.round(ta_setting.sync_time);
        seconds = total_seconds%60;
        if(seconds<10) seconds="0"+seconds;
        minutes = (total_seconds-seconds)/60%60;
        if(minutes<10) minutes="0"+minutes;
        hours = (total_seconds-seconds-minutes*60)/3600;
        if(hours<10) hours="0"+hours;
        document.querySelector("#video_sync_with_ta").innerHTML = "与TA同步 "+hours+":"+minutes+":"+seconds;
    }
    else{
        document.querySelector("#video_sync_with_ta").innerHTML = "与TA同步（未登录）";
    }
}

//程序入口
(function() {
    me_setting.user_email = localStorage.me_emial || me_email;
    ta_setting.user_email = localStorage.ta_emial || ta_email;
    search_gist_by_email(me_setting);
    search_gist_by_email(ta_setting);

    //登录时清除服务器配置
    set_setting(me_setting);
    set_setting(ta_setting);

    if(localStorage.access_token!==undefined) access_token = localStorage.access_token;
    createMenu();
    setTimeout(function() {
        timer = setInterval(function () {
            createMenu();

            // if(document.querySelector('video')) {
            //     if(is_mouse_enter===false) {
            //         button_opacity -= 0.2;
            //         if(button_opacity<0) button_opacity=0;
            //     }
            //     else {
            //         button_opacity = 1;
            //     }
            //
            //     if(is_mouse_move===true) {
            //         is_mouse_move = false;
            //         button_opacity = 1;
            //     }
            //         document.querySelector('video').style.zIndex = '1';
            //         document.querySelector("#video_sync_menu").style.opacity = button_opacity;
            //         document.querySelector("#video_sync_menu").style.display="block";
            //
            timer_callback();
            // }
            // else{
            //     document.querySelector("#video_sync_menu").style.display="none";
            // }
        }, 200);
    }, 2000);

    if(navigator.userAgent.search('Mac')>=0) completion(0);
})();