const getElementById = (id) => document.getElementById(id) || null;

// Initializing
const headerMenuDeposit = getElementById('hm-d');
const headerMenuWithdraw = getElementById('hm-w');
const headerMenuUtils = getElementById('hm-u');
const headerMenuLogs = getElementById('hm-l');
const headerMenus = [headerMenuDeposit, headerMenuWithdraw, headerMenuUtils, headerMenuLogs];

const cardDeposit = getElementById('c-d');
const cardWithdraw = getElementById('c-w');
const cardUtils = getElementById('c-u');
const cardLogs = getElementById('c-l');
const cards = [cardDeposit, cardWithdraw, cardUtils, cardLogs];

headerMenuDeposit.addEventListener('click', () => {
    toggleMenu(0);
    toggleCard(0);
});
headerMenuWithdraw.addEventListener('click', () => {
    toggleMenu(1);
    toggleCard(1);
});
headerMenuUtils.addEventListener('click', () => {
    toggleMenu(2);
    toggleCard(2);
});
headerMenuLogs.addEventListener('click', () => {
    toggleMenu(3);
    toggleCard(3);
});

const toggleMenu = (index) => {
    headerMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleCard = (index) => {
    cards.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

const cwHeaderMenuWithdraw = getElementById('cw-hm-w');
const cwHeaderMenuProve = getElementById('cw-hm-p');
const cwHeaderMenuFinalize = getElementById('cw-hm-f');
const cwHeaderMenus = [cwHeaderMenuWithdraw, cwHeaderMenuProve, cwHeaderMenuFinalize];

const cwCardBodyWithdraw = getElementById('cw-cb-w');
const cwCardBodyProve = getElementById('cw-cb-p');
const cwCardBodyFinalize = getElementById('cw-cb-f');
const cwCardBodies = [cwCardBodyWithdraw, cwCardBodyProve, cwCardBodyFinalize];

cwHeaderMenuWithdraw.addEventListener('click', () => {
    toggleCwMenu(0);
    toggleCwCardBody(0);
});
cwHeaderMenuProve.addEventListener('click', () => {
    toggleCwMenu(1);
    toggleCwCardBody(1);
});
cwHeaderMenuFinalize.addEventListener('click', () => {
    toggleCwMenu(2);
    toggleCwCardBody(2);
});

const toggleCwMenu = (index) => {
    cwHeaderMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleCwCardBody = (index) => {
    cwCardBodies.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

const clHeaderMenuBatcher = getElementById('cl-hm-b');
const clHeaderMenuDerivater = getElementById('cl-hm-d');
const clHeaderMenuProposer = getElementById('cl-hm-p');
const clHeaderMenus = [clHeaderMenuBatcher, clHeaderMenuDerivater, clHeaderMenuProposer];

const clCardBodyBatcher = getElementById('cl-cb-b');
const clCardBodyDerivater = getElementById('cl-cb-d');
const clCardBodyProposer = getElementById('cl-cb-p');
const clCardBodies = [clCardBodyBatcher, clCardBodyDerivater, clCardBodyProposer];

clHeaderMenuBatcher.addEventListener('click', () => {
    toggleClMenu(0);
    toggleClCardBody(0);
});

clHeaderMenuDerivater.addEventListener('click', () => {
    toggleClMenu(1);
    toggleClCardBody(1);
});

clHeaderMenuProposer.addEventListener('click', () => {
    toggleClMenu(2);
    toggleClCardBody(2);
});

const toggleClMenu = (index) => {
    clHeaderMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    });
}

const toggleClCardBody = (index) => {
    clCardBodies.forEach((card, i) => {
        if (i === index) {
            card.classList.remove('d-none');
        } else {
            card.classList.add('d-none');
        }
    });
}

const addressInputForm = getElementById('ai-f');
const addressInputGuest1Button = getElementById('ai-g1-b');
const addressInputGuest2Button = getElementById('ai-g2-b');
const addressInputConfirmButton = getElementById('ai-c-b');

addressInputGuest1Button.addEventListener('click', (e) => {
    addressInputForm.elements['private_key'].value = '0xd0e75dfba50305d01e7214d2277da32ea231ddae1ef6f177513e0cac297a8c8b';
    addressInputForm.submit();
});
addressInputGuest2Button.addEventListener('click', (e) => {
    addressInputForm.elements['private_key'].value = '0x16ece39bc45c3355f50684eda4363c76d4e1f5e5a37a0c0989d734cb6257c37b';
    addressInputForm.submit();
});
addressInputConfirmButton.addEventListener('click', (e) => {
    addressInputForm.submit();
});

// socket setup
const socket = io('/rollup');

socket.on("connect", () => {
    console.log(socket.connected); // true
});

socket.on("disconnect", () => {
    console.log(socket.connected); // false
});

// socket data
const outputRootText = getElementById('ori-or');
const l2OutputIndexText = getElementById('ori-l2-oi');
const l2BlockNumberText = getElementById('ori-l2-bn');
const l1TimestampText = getElementById('ori-l1-ts');
socket.on('onOutputProposed', (data) => {
    outputRootText.value = data.outputRoot;
    l2OutputIndexText.value = data.l2OutputIndex;
    l2BlockNumberText.value = data.l2BlockNumber;
    l1TimestampText.value = data.l1Timestamp;
})

const l2BalanceText = getElementById('l2-b-t');
const l3BalanceText = getElementById('l3-b-t');
socket.on('onBalancesUpdated', (data) => {
    l2BalanceText.value = data.l2Balance;
    l3BalanceText.value = data.l3Balance;
});

// socket request
const cdDepositForm = getElementById('cd-df');
const cdDepositSubmitButton = getElementById('cd-ds');
const cdDepositResponseCardBody = getElementById('cd-dr-cb');

const cwWithdrawForm = getElementById('cw-wf');
const cwWithdrawSubmitButton = getElementById('cw-ws');
const cwWithdrawResponseCardBody = getElementById('cw-wr-cb');

const cwProveForm = getElementById('cw-pf');
const cwProveSubmitButton = getElementById('cw-ps');
const cwProveResponseCardBody = getElementById('cw-pr-cb');

const cwFinalizeForm = getElementById('cw-ff');
const cwFinalizeSubmitButton = getElementById('cw-fs');
const cwFinalizeResponseCardBody = getElementById('cw-fr-cb');

const cuSendBulkSubmitButton = getElementById('cu-ss');
const cuSendBulkResponseCardBody = getElementById('cu-sr-cb');

const clBatcherStartButton = getElementById('cl-bs');
const clBatcherClearButton = getElementById('cl-bc');
const clBatcherResponseCardBody = getElementById('cl-br-cb');

const clDerivaterStartButton = getElementById('cl-ds');
const clDerivaterClearButton = getElementById('cl-dc');
const clDerivaterResponseCardBody = getElementById('cl-dr-cb');

const clProposerStartButton = getElementById('cl-ps');
const clProposerClearButton = getElementById('cl-pc');
const clProposerResponseCardBody = getElementById('cl-pr-cb');

const init = () => {
    attachQueryLogsToForm(
        cdDepositForm, 
        cdDepositSubmitButton, 
        cdDepositResponseCardBody, 
        'onDepositRequested', 
        'onDepositLog'
    );

    attachQueryLogsToForm(
        cwWithdrawForm, 
        cwWithdrawSubmitButton, 
        cwWithdrawResponseCardBody, 
        'onWithdrawRequested', 
        'onWithdrawLog'
    );

    attachQueryLogsToForm(
        cwProveForm, 
        cwProveSubmitButton, 
        cwProveResponseCardBody, 
        'onProveRequested', 
        'onProveLog'
    );

    attachQueryLogsToForm(
        cwFinalizeForm, 
        cwFinalizeSubmitButton, 
        cwFinalizeResponseCardBody, 
        'onFinalizeRequested', 
        'onFinalizeLog'
    );

    attachQueryLogsToForm(
        null,
        cuSendBulkSubmitButton,
        cuSendBulkResponseCardBody,
        'onBulkRequested',
        'onBulkLog'
    );

    attachGeneralLogs(
        clBatcherStartButton,
        clBatcherClearButton,
        clBatcherResponseCardBody,
        'onBatcherLog'
    );

    attachGeneralLogs(
        clDerivaterStartButton,
        clDerivaterClearButton,
        clDerivaterResponseCardBody,
        'onDerivaterLog'
    );

    attachGeneralLogs(
        clProposerStartButton,
        clProposerClearButton,
        clProposerResponseCardBody,
        'onProposerLog'
    );
}

// utility
const attachQueryLogsToForm = (
    form, submitButton, responseCardBody, socketEmitEvent, socketOnEvent
) => {
    submitButton.addEventListener('click', (e) => {
        if(socketEmitEvent){
            if(form) {
                const formData = new FormData(form);
                const data = formDataToJson(formData);
                if (!data) {
                    return;
                }
    
                socket.emit(socketEmitEvent, data);
            } else {
                socket.emit(socketEmitEvent, null);
            }
        }
    
        responseCardBody.innerHTML = '';
    });
    socket.on(socketOnEvent, (text) => {
        var elem = responseCardBody;
        if (typeof text === 'object') {
            addPreElem(elem, balancesToText(text));
        } else {
            addPreElem(elem, text);
        }
    });
}

const attachGeneralLogs = (
    startButton, clearButton, responseCardBody, socketOnEvent
) => {
    startButton.addEventListener('click', (e) => {
        if (startButton.innerText === 'Start') {
            startButton.innerText = 'Stop';
        } else if (startButton.innerText === 'Stop') {
            startButton.innerText = 'Start';
        }
    });
    clearButton.addEventListener('click', (e) => {
        responseCardBody.innerHTML = '';
    });
    socket.on(socketOnEvent, (text) => {
        if(startButton.innerText === 'Stop') {
            var elem = responseCardBody;
            if (typeof text === 'object') {
                addPreElem(elem, balancesToText(text));
            } else {
                addPreElem(elem, text);
            }
        }
    });
}

const addPreElem = (elem, text) => {
    const preElem = document.createElement('pre');
    preElem.style = 'color: white;';
    preElem.innerText = text;
    elem.appendChild(preElem);
}

const balancesToText = (balances) => {
    balanceLogData = {
        before: {
            l2Balance: l2BalanceText.value,
            l3Balance: l3BalanceText.value,
        },
        after: {
            l2Balance: balances.l2Balance,
            l3Balance: balances.l3Balance,
        }
    }

    return JSON.stringify(balanceLogData, null, 2);
}

const formDataToJson = (formData) => {
    const data = {};
    var valid = true;
    formData.forEach((value, key) => {
        if (value === '' || value === null) {
            valid = false;
            alert('All fields are required');
            return false;
        }
        data[key] = value;
    });
    if (!valid) {
        return false;
    }
    return data;
}

// init
init();