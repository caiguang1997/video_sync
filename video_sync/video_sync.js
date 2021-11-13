// ==UserScript==
// @name         视频同步助手
// @namespace    caiguang1997
// @version      1.2
// @description  视频同步助手（测试版本，请勿下载）
// @author       caiguang1997
// @include      *
// @exclude      *message.bilibili.com*
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

//TODO:
//1. 将本地时间与视频时间打包发送云端，另一端获取后再同步
//2. 本地视频功能未添加

var access_token = "b3d23a312114fc5c3f8a8356dc1efaf5";
const gist_id = "5j10kbfng38pa9h7lqiuz90";

var setting = {
    version: 1.0,
    user_num: 0,
    user_CG: {
        user_id:"null",
        video_link:"null",
        video_paused:"null",
        video_speed:"null",
        episode:"null",
        sync_time:"null",
    },
    user_YY: {
        user_id:"null",
        video_link:"null",
        video_paused:"null",
        video_speed:"null",
        episode:"null",
        sync_time:"null",
    }
}

var setting_local = setting.user_CG;
var setting_remote = setting.user_YY;

var timer = null;
var first_in = true;
var is_mouse_move = false;
var is_mouse_enter = false;
var button_opacity = 1;
var file_content = "";

var my_id = "CG";
// var my_id = "YY";

var remote_file_content = "\
<version>1.0</version>\
\n\
<user_num>0</user_num>\
\n\
<user>\
<user_id>null</user_id>\
<video_link>null</video_link>\
<video_paused>null</video_paused>\
<video_speed>null</video_speed>\
<episode>null</episode>\
<sync_time>null</sync_time>\
</user>\
\n\
<user>\
<user_id>null</user_id>\
<video_link>null</video_link>\
<video_paused>null</video_paused>\
<video_speed>null</video_speed>\
<episode>null</episode>\
<sync_time>null</sync_time>\
</user>\
";

// Convert string to web element
function parseDom(arg) {
    var d = document.createElement('div');
    d.innerHTML = arg;
    return d.firstChild;
}

// Create new button
function createButton(id, top, contain, handler) {
    var buttonHtml = '<button ' +
        'id=""' + id + ' ' +
        'style="' +
        'display: none;' +
        'opacity: 0;' +
        '-webkit-user-select: none;' +
        'cursor: pointer;' +
        'background-color: #fec1de;' +
        'position: fixed;' +
        'top: ' + top + ';' +
        'right: 0;' +
        'width: 150px;' +
        'height: 30px;' +
        'padding: 2px 2px 2px 5px;' +
        'box-sizing: border-box;' +
        'margin: 0 3px;' +
        'float: left;' +
        'border-radius: 15px;' +
        'outline: none;' +
        'z-index: 2147483647;' +
        '">' +
        contain +
        '</button>';
    var new_button = parseDom(buttonHtml);
    new_button.onclick = handler;
    return new_button;
}

// Microphone Detect
var origin_volume = 0.4;
var specific_volume = 0.1;
var if_specific_volume = false;
var specific_volume_cnt = 0;    //持续时间
function beginDetect() {
    let audioContext = new (window.AudioContext || window.webkitAudioContext)()
    let mediaStreamSource = null;
    let scriptProcessor = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 获取用户的media信息
        navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
            // 将麦克风的声音输入这个对象
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            // 创建一个音频分析对象，采样的缓冲区大小为4096，输入和输出都是单声道
            scriptProcessor = audioContext.createScriptProcessor(4096,1,1);
            // 将该分析对象与麦克风音频进行连接
            mediaStreamSource.connect(scriptProcessor);
            // 此举无甚效果，仅仅是因为解决 Chrome 自身的 bug
            scriptProcessor.connect(audioContext.destination);

            // 开始处理音频
            scriptProcessor.onaudioprocess = function(e) {
                // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
                let buffer = e.inputBuffer.getChannelData(0);
                // 获取缓冲区中最大的音量值
                let maxVal = Math.max.apply(Math, buffer);

                if(maxVal>0.1)
                {
                    if(if_specific_volume===false) origin_volume = document.querySelector('video').volume;
                    if_specific_volume = true;  //todo:对方是否有声音
                    specific_volume_cnt = 0;
                }

                if(if_specific_volume)
                {
                    specific_volume_cnt++;
                    if(specific_volume_cnt>20) if_specific_volume = false;
                    document.querySelector('video').volume = specific_volume;
                }
                else
                {
                    if_specific_volume = false;
                    document.querySelector('video').volume = origin_volume;
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
beginDetect()

//生成min到max之间的随机整数
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//获取服务器配置
// user_num = remote_file_content.match(/(?<=<user_num>).*(?=<\/user_num>)/);
// user_contain = remote_file_content.match(/(?<=<user>).*(?=<\/user>)/g);
function get_server_setting() {
    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            if(this.responseText.search("video_sync.html")!==-1) {
                file_content = JSON.parse(this.responseText)["files"]["video_sync.html"]["content"];
                var user_contains = file_content.match(/(?<=<user>).*(?=<\/user>)/g);
                if(user_contains.search("user_id")!==-1) {
                    var index = 0;
                    if(user_contains[0].match(/(?<=<user_id>).*?(?=<\/user_id>)/)[0]!=my_id) index = 1;
                    for(let key in setting_remote)
                    {
                        var my_str = "(?<=<" + key + ">).*?(?=<\/" + key + ">)";
                        var my_reg = new RegExp(my_str);
                        setting_remote[key] = user_contains[index].match(my_reg)[0];
                    }
                }
            }
            else {
                console.log(this.responseText);
            }
        }
    });

    xhr.open("GET", "https://gitee.com/api/v5/gists/" + gist_id + "?access_token=" + access_token);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.send();
}

//修改服务器配置
function set_server_setting(setting) {
    var data = "{\"access_token\":\""+access_token+"\",\"files\":{\"video_sync.html\":{\"content\":\"" + file_content + "\"}},\"description\":\"video_sync\",\"public\":\"false\"}";
    data = data.replace(/\r\n/g, "\\r\\n");
    data = data.replace(/(?<=<user_id>).*?(?=<\/user_id>)/, setting.user_id);
    data = data.replace(/(?<=<video_link>).*?(?=<\/video_link>)/, setting.video_link);
    data = data.replace(/(?<=<video_paused>).*?(?=<\/video_paused>)/, setting.video_paused);
    data = data.replace(/(?<=<video_speed>).*?(?=<\/video_speed>)/, setting.video_speed);
    data = data.replace(/(?<=<episode>).*?(?=<\/episode>)/, setting.episode);
    data = data.replace(/(?<=<sync_time>).*?(?=<\/sync_time>)/, setting.sync_time);

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            if(first_in) {
                first_in = false;
            }
            else {
                if(this.responseText.search("Access token does not exist")>=0) {
                    access_token = prompt("请输入有效的token或关闭本油猴脚本", access_token);
                    localStorage.access_token = access_token;
                }
                else if(this.responseText.search('Gist')>=0) {
                    alert("have no such gist!");
                }
                else if(this.responseText.search("video_sync.html")!==-1) {
                    console.log("set server setting successfully!");
                }
                else {
                    console.log(this.responseText);
                }
            }
        }
    });

    xhr.open("PATCH", "https://gitee.com/api/v5/gists/" + gist_id);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.send(data);
}

//发送同步配置
function sync_to_me() {
    setting_local.video_link = location.href;
    setting_local.video_paused = document.querySelector('video').paused + "";
    setting_local.video_speed = document.querySelector('video').playbackRate + "";
    // setting_local.episode = document.querySelector("#eplist_module > div.list-wrapper.simple > ul > li.ep-item.cursor.badge.visited").innerText.match(/\d*/)[0];
    setting_local.sync_time = document.querySelector('video').currentTime + "";
    set_server_setting(setting_local);
}

function sync_to_ta() {
    document.querySelector('video').currentTime = setting_remote.sync_time*1;
}

//接收同步配置
function timer_callback() {
    get_server_setting();

    const time_offset = 1;//视频缓冲时的时间补偿
    //同步视频链接
    // if(location.href!==setting_remote.video_link&&setting_remote.video_link!=="null") {
    //     set_server_setting(new SettingInit());//TODO:
    //     clearInterval(timer);
    //     location.href = setting_remote.video_link;
    // }
    // else {
    if(setting_remote.user_id!==setting_local.user_id&&setting_remote.user_id!=="null") {
        if(setting_remote.sync_time!=="null") {
            //同步时间并同步开始暂停
            if(setting_remote.video_paused==="true") {
                document.querySelector('video').currentTime = setting_remote.sync_time*1;
                document.querySelector('video').pause();
            }
            else {
                document.querySelector('video').currentTime = setting_remote.sync_time*1 + time_offset;
                document.querySelector('video').play();
            }
            //TODO：同步播放速度，同步集数，同步弹幕

            console.log("sync_time: " + setting_remote.sync_time);
        }
        set_server_setting(new SettingInit());
    }
    // }

    var seconds;
    var minutes;
    var hours;
    var total_seconds;

    total_seconds = Math.round(setting_local.sync_time);
    seconds = total_seconds%60;
    minutes = (total_seconds-seconds)/60%60;
    hours = (total_seconds-seconds-minutes*60)/3600;
    document.querySelector("#video_sync_me").innerHTML = "与我同步<"+hours+":"+minutes+":"+seconds+":"+">";

    total_seconds = Math.round(setting_remote.sync_time);
    seconds = total_seconds%60;
    minutes = (total_seconds-seconds)/60%60;
    hours = (total_seconds-seconds-minutes*60)/3600;
    document.querySelector("#video_sync_ta").innerHTML = "与TA同步<"+hours+":"+minutes+":"+seconds+":"+">";
}

//程序入口
(function() {
    //登录时清除服务器配置
    get_server_setting();
    set_server_setting();

    // setting_local.user_id = "id_" + access_token + "_" + randomInt(0, 10000000000);
    setting_local.user_id = "id_" + my_id;

    if(localStorage.access_token!==undefined) access_token = localStorage.access_token;

    document.querySelector("body").appendChild(createButton("video_sync_me", "45%", "与我同步<00:00:00>", sync_to_me));    //创建按键
    document.querySelector("body").appendChild(createButton("video_sync_ta", "55%", "与TA同步<00:00:00>", sync_to_ta));    //创建按键
    document.querySelector("body").onmousemove = function () {is_mouse_move = true;};
    document.querySelector("#video_sync_me").onmouseenter = function () {is_mouse_enter = true;};  //TODO:有点小bug，当鼠标原本就在按键上时，刷新会无效，不过也就一次无效
    document.querySelector("#video_sync_me").onmouseleave = function () {is_mouse_enter = false;};
    document.querySelector("#video_sync_ta").onmouseenter = function () {is_mouse_enter = true;};  //TODO:有点小bug，当鼠标原本就在按键上时，刷新会无效，不过也就一次无效
    document.querySelector("#video_sync_ta").onmouseleave = function () {is_mouse_enter = false;};

    setTimeout(function() {
        timer = setInterval(function (){
            if(document.querySelector('video')) {
                if(is_mouse_enter===false) {
                    // button_opacity -= 0.05;
                    if(button_opacity<0) button_opacity=0;
                }
                else {
                    button_opacity = 1;
                }

                if(is_mouse_move===true) {
                    is_mouse_move = false;
                    button_opacity = 1;
                }
                document.querySelector('video').style.zIndex = '1';
                document.querySelector("#video_sync_me").style.opacity = button_opacity;
                document.querySelector("#video_sync_ta").style.opacity = button_opacity;
                document.querySelector("#video_sync_me").style.display="block";
                document.querySelector("#video_sync_ta").style.display="block";
                timer_callback();
            }
            else{
                document.querySelector("#video_sync_me").style.display="none";
                document.querySelector("#video_sync_ta").style.display="none";
            }
        }, 100);
    }, 2000);
})();
