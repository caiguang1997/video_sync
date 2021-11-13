// ==UserScript==
// @name         观看本地视频
// @namespace    caiguang1997
// @version      1.0
// @description  观看本地视频
// @author       caiguang1997
// @include      *
// @icon         https://www.google.com/s2/favicons?domain=bilibili.com
// @grant        none
// @run-at       document-end
// ==/UserScript==

var access_token = "b3d23a312114fc5c3f8a8356dc1efaf5";
const gist_id = "te8hxbol9rasy65ci3vjg50";

//程序入口
(function() {
    var xhr = new XMLHttpRequest();
    // xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            var my_html = JSON.parse(this.responseText)["files"]["watch_local_video.html"]["content"];
            // console.log(my_html);
            document.open();
            document.write(my_html)
            document.close();
        }
    });

    xhr.open("GET", "https://gitee.com/api/v5/gists/" + gist_id + "?access_token=" + access_token);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();
})();
