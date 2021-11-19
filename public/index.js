import MseStream from './module/mse.js';




window.addEventListener('DOMContentLoaded', () => {
    let player  = new MseStream();
    console.log(player);

    let btn = document.querySelector('.btn_play');

    btn.addEventListener('click', () => {
        // player.attachMediaElement();
        player.start();
    });
    // let player = new MseStream();
    // player.attachMediaElement();

});