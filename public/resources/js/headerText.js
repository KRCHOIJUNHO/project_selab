const header1 = document.querySelector('.header1');
const header2 = document.querySelector('.header2');
const header3 = document.querySelector('.header3');
var count = 3;

setInterval(function () {
    if (count == 1) {
        header1.classList.remove('none');
        header3.classList.add('none');
    } else if (count == 2) {
        header2.classList.remove('none');
        header1.classList.add('none');
    } else if (count == 3) {
        header3.classList.remove('none');
        header2.classList.add('none');
    }
    count++;
    if (count == 4) count = 1;
}, 7000);
