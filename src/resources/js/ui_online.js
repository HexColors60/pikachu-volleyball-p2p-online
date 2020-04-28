/**
 * Manages outputs to and inputs from the html elements UI
 * and event listeners relevant to the UI of the web page
 */
'use strict';
import {
  channel,
  createRoom,
  joinRoom,
  sendChatMessageToPeer,
  closeAndCleaning,
} from './data_channel.js';
import { generatePushID } from './generate_pushid.js';
import { myKeyboard } from './pikavolley_online.js';
import { testNetwork } from './network_test.js';
import '../style.css';

const chatOpenBtn = document.getElementById('chat-open-btn');
const chatInputAndSendBtnContainer = document.getElementById(
  'chat-input-and-send-btn-container'
);
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

export function setUpUI() {
  // game keyboard input needs to be unsubscribe for typing join room ID
  myKeyboard.unsubscribe();

  const networkTestBtn = document.getElementById('network-test-btn');
  const createBtn = document.getElementById('create-btn');
  const joinBtn = document.getElementById('join-btn');
  const joinRoomIdInput = document.getElementById('join-room-id-input');
  const disableBtns = () => {
    // @ts-ignore
    networkTestBtn.disabled = true;
    // @ts-ignore
    createBtn.disabled = true;
    // @ts-ignore
    joinBtn.disabled = true;
    // @ts-ignore
    joinRoomIdInput.disabled = true;
  };
  const enableBtns = () => {
    // @ts-ignore
    networkTestBtn.disabled = false;
    // @ts-ignore
    createBtn.disabled = false;
    // @ts-ignore
    joinBtn.disabled = false;
    // @ts-ignore
    joinRoomIdInput.disabled = false;
  };
  networkTestBtn.addEventListener('click', () => {
    disableBtns();
    const callBackIfPassed = () => {
      window.alert(document.getElementById('test-passed').textContent);
    };
    const callBackIfDidNotGetSrflx = () => {
      window.alert(
        document.getElementById('did-not-get-srflx-candidate').textContent
      );
    };
    const callBackIfBehindSymmetricNat = () => {
      window.alert(document.getElementById('behind-symmetric-nat').textContent);
    };
    testNetwork(
      enableBtns,
      callBackIfPassed,
      callBackIfDidNotGetSrflx,
      callBackIfBehindSymmetricNat
    );
  });
  createBtn.addEventListener('click', () => {
    disableBtns();

    const roomId = generatePushID();
    createRoom(roomId).then(() => {
      printCurrentRoomID(roomId);
    });
  });
  joinBtn.addEventListener('click', () => {
    disableBtns();

    const roomId = getJoinRoomID();
    joinRoom(roomId).then((joined) => {
      if (joined) {
        printCurrentRoomID(roomId);
      } else {
        enableBtns();
      }
    });
  });
  chatOpenBtn.addEventListener('click', chatOpenBtnClicked);
  sendBtn.addEventListener('click', sendBtnClicked);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      if (!chatOpenBtn.classList.contains('hidden')) {
        chatOpenBtn.click();
      } else {
        // @ts-ignore
        chatInput.value = '';
        // This setTimeout is for Korean input weired thing which happens on Chrome..
        // When Korean character typed on input element and press some key (for example, esc key),
        // the key event occur twice on Chrome browser. (It was not the case on Firefox or Safari.)
        // This setTimeout prevent the event occur twice.
        window.setTimeout(() => sendBtn.click(), 0);
      }
      event.preventDefault();
    } else if (event.code === 'Enter') {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'Enter') {
      if (!chatInputAndSendBtnContainer.classList.contains('hidden')) {
        window.setTimeout(() => sendBtn.click(), 0);
      }
    }
  });

  const noticeDisconnectedOKBtn = document.getElementById(
    'notice-disconnected-ok-btn'
  );
  noticeDisconnectedOKBtn.addEventListener('click', () => {
    location.reload();
  });

  window.addEventListener('unload', closeAndCleaning);

  window.addEventListener('beforeunload', function (e) {
    if (channel.isOpen) {
      // Cancel the event
      e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
      // Chrome requires returnValue to be set
      e.returnValue = '';
    }
  });

  disableChatBtns();
}

function printCurrentRoomID(roomId) {
  const prettyRoomId = `${roomId.slice(0, 5)}-${roomId.slice(
    5,
    10
  )}-${roomId.slice(10, 15)}-${roomId.slice(15)}`;
  document.getElementById('current-room-id').textContent = prettyRoomId;
}

function getJoinRoomID() {
  return (
    document
      .getElementById('join-room-id-input')
      // @ts-ignore
      .value.trim()
      .split('-')
      .join('')
  );
}

/**
 * Print log to connection log box
 * @param {string} log
 */
export function printLog(log) {
  const connectionLog = document.getElementById('connection-log');
  connectionLog.textContent += `${log}\n`;
  connectionLog.scrollIntoView();
}

export function printNotValidRoomIdMessage() {
  printLog(document.getElementById('not-valid-room-id-message').textContent);
}

export function printNoRoomMatchingMessage() {
  printLog(document.getElementById('no-room-matching-message').textContent);
}

export function showGameCanvas() {
  const flexContainer = document.getElementById('flex-container');
  const beforeConnection = document.getElementById('before-connection');
  if (!beforeConnection.classList.contains('hidden')) {
    beforeConnection.classList.add('hidden');
  }
  flexContainer.classList.remove('hidden');
  myKeyboard.subscribe();
}

export function hidePingBox() {
  const pingBox = document.getElementById('ping-box');
  if (!pingBox.classList.contains('hidden')) {
    pingBox.classList.add('hidden');
  }
}

export function printAvgPing(avgPing) {
  document.getElementById('average-ping').textContent = String(avgPing);
}

export function printStartsIn(startsIn) {
  document.getElementById('starts-in').textContent = String(startsIn);
}

export function hideWatingPeerAssetsLoadingBox() {
  const peerLoadingBox = document.getElementById('peer-loading-box');
  if (!peerLoadingBox.classList.contains('hidden')) {
    peerLoadingBox.classList.add('hidden');
  }
}

export function noticeDisconnected() {
  document.getElementById('notice-disconnected').classList.remove('hidden');
}

export function enableChatOpenBtn() {
  // @ts-ignore
  chatOpenBtn.disabled = false;
}

function disableChatBtns() {
  // @ts-ignore
  chatInput.disabled = true;
  // @ts-ignore
  chatOpenBtn.disabled = true;
  // @ts-ignore
  sendBtn.disabled = true;
}

function chatOpenBtnClicked() {
  // @ts-ignore
  chatOpenBtn.disabled = true;
  // @ts-ignore
  chatInput.disabled = false;
  // @ts-ignore
  sendBtn.disabled = false;
  myKeyboard.unsubscribe();
  if (!chatOpenBtn.classList.contains('hidden')) {
    chatOpenBtn.classList.add('hidden');
  }
  chatInputAndSendBtnContainer.classList.remove('hidden');
  chatInput.focus({ preventScroll: true });
}

function sendBtnClicked() {
  disableChatBtns();
  myKeyboard.subscribe();
  if (!chatInputAndSendBtnContainer.classList.contains('hidden')) {
    chatInputAndSendBtnContainer.classList.add('hidden');
  }
  chatOpenBtn.classList.remove('hidden');
  // @ts-ignore
  const message = chatInput.value;
  if (message === '') {
    enableChatOpenBtn();
    return;
  }
  // @ts-ignore
  chatInput.value = '';
  sendChatMessageToPeer(message);
}
