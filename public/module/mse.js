export default class MseStream {
    constructor() {
        this.mime = 'video/mp4; codecs="avc1.42E01F, mp4a.40.2"';
        // if (!MediaSource.isTypeSupported(this.mime)) {
        //     document.querySelector('h1').append(' - Unsuported mime type :(');
        // }
        this.buffer;
        this.websocket;
        this.buffer_size = 5*1024*1024;
        this.buffer_index = 0;
        this.frag_mp4_buffer = new Uint8Array(this.buffer_size);
        this.video = document.getElementById('video_element');
        this.mediaSource = new MediaSource();
    }

    toInt(arr, index) { 
        var dv = new DataView(arr.buffer);
        // console.log(arr.buffer);
        return dv.getInt32(index, false); 
    }

    toString(arr, fr, to) { 
        return String.fromCharCode.apply(null, arr.slice(fr,to));
    }

    getBox(arr, i) { 
        return [this.toInt(arr, i), this.toString(arr, i+4, i+8)]
    }

    getSubBox(arr, box_name) { 
        let i = 0;
        let res = this.getBox(arr, i);
        let main_length = res[0]; 
        let name = res[1]; 
        i = i + 8;
        
        var sub_box = null;
        
        while (i < main_length) {
            res = this.getBox(arr, i);
            l = res[0]; name = res[1];
            
            if (box_name == name) {
                sub_box = arr.slice(i, i+l)
            }
            i = i + l;
        }
        return sub_box;
    }

    hasFirstSampleFlag(arr) {
            
        var traf = this.getSubBox(arr, "traf");
        if (traf==null) { return false; }
        
        var trun = this.getSubBox(traf, "trun");
        if (trun==null) { return false; }
        
        var flags = trun.slice(10,13);
        f = flags[1] & 4; 
        console.log('okok');
        return f == 4;
    }

    // attachMediaElement() {
        

        
    // }

    start() {
        this.mediaSource.addEventListener('sourceended', function(e) { console.log('sourceended: ' + this.mediaSource.readyState); });
        this.mediaSource.addEventListener('sourceclose', function(e) { console.log('sourceclose: ' + this.mediaSource.readyState); });
        this.mediaSource.addEventListener('error', function(e) { console.log('error: ' + this.mediaSource.readyState); });
        this.video.src = window.URL.createObjectURL(this.mediaSource);
        this.mediaSource.addEventListener('sourceopen', function(e) {


            console.log('sourceopen: ' + this.mediaSource.readyState);

            this.video.muted = true;
            this.video.play();

            this.buffer = this.mediaSource.addSourceBuffer(this.mime);

            this.buffer.addEventListener('updateend', function(e) {
                if (this.video.duration && !this.video.currentTime) {
                    // video.currentTime = video.duration;
                    this.video.currentTime = this.video.buffered.end(0);
                }
            });

            this.websocket = new WebSocket('wss://stage.cloud.atmosfera.cam/ws-mse/mr-rust-main/');
            this.websocket.binaryType = 'arraybuffer';

            this.websocket.onopen = function() {
                let resolution = 720;
                let bin = JSON.stringify({ resolution });
                
                function strToAb(str) {
                    return new Uint8Array(str.split('')
                    .map(c => c.charCodeAt(0))).buffer;
                }



                this.websocket.send(strToAb(bin));
            }; 

            this.websocket.addEventListener('message', function(e) {
                this.websocket.send('PING');
                    // video.videoTracks.onaddtrack = (event) => {
                    //     console.log(`Video track: ${event.track.label} removed`);
                    // };
                    // console.log(video.videoTracks)
                let data = new Uint8Array(e.data);

                let res = this.getBox(data, 0);
                let main_length = res[0]; 
                let name = res[1];

                if (data.length) {
                    if((this.buffer_index + data.length) <= this.buffer_size){
                        this.frag_mp4_buffer.set(data, this.buffer_index);
                        this.buffer_index = this.buffer_index + data.length;

                        if (!this.buffer.updating && this.mediaSource.readyState == 'open') {
                            let appended = this.frag_mp4_buffer.slice(0, this.buffer_index);

                            // if (name=="moof") {
                            //     if (hasFirstSampleFlag(data)) {
                                    // pass = pass + 1;
                                    this.buffer.appendBuffer(appended);
                                    // console.log(buffer);
                                // }
                                // else {
                                //     return;
                                // }
                            // }

                            this.frag_mp4_buffer.fill(0);
                            this.buffer_index = 0;
                        }
                    }
                }
            }, false);
        });
    }
}


// let player  = new MseStream();
// player.attachMediaElement();