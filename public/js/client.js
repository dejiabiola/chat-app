//required for front end communication between client and server
const socket = io();

// Select Elements in the DOM that will be used by Javascript
const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const isTypingContainer = document.querySelector("#typing");
const toast = document.querySelector('.toast');
const toastBody = document.querySelector('.toast-body');
const bsAlert = new bootstrap.Toast(toast);


let userName = "";
let id;
let typing = false;
let timeout = undefined;

// when DOM loads, attach a keydown event listener to the input field
// that notifies when user is typing
document.addEventListener('DOMContentLoaded', () => {
  inputField.addEventListener('keydown', (e) => {
    if (e.keyCode !== 13) {
      typing = true;
      socket.emit('typing', { user: userName, typing: true })
      clearTimeout(timeout)
      timeout = setTimeout(typingTimeout, 1200)
    } else {
      clearTimeout(timeout)
      typingTimeout()
    }
  })
})

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }

  socket.emit("chat message", {
    message: inputField.value,
    nick: userName,
  });

  inputField.value = "";
});


const typingTimeout = () => {
  typing = false
  socket.emit('typing', { user: userName, typing: false })
}

const newUserConnected = function (data) {
  //give the user a random unique id
  id = Math.floor(Math.random() * 1000000);
  userName = 'user-' + id;

  //emit an event with the user id
  socket.emit("new user", userName);
  //call
  addToUsersBox(userName);
};

const addToUsersBox = function (userName) {
  //This if statement checks whether an element of the user-userlist
  //exists and then inverts the result of the expression in the condition
  //to true, while also casting from an object to boolean
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }

  //setup the divs for displaying the connected users
  //id is set to a string including the username
  toastBody.textContent = `${userName} has joined the chat`
  bsAlert.show()
  const userBox = `
    <div class="chat_id ${userName}-userlist">
      <p class="active-user-name">${userName}</p>
    </div>
  `;
  //set the inboxPeople div with the value of userbox
  inboxPeople.innerHTML += userBox;
};

//call 
newUserConnected();

const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("en-US", { hour: "numeric", minute: "numeric" });

  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p class="mb-0">${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p class="mb-0">${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  //is the message sent or received
  messageBox.innerHTML += user === userName ? myMsg : receivedMsg;
};



socket.on("chat message", function (data) {
  addNewMessage({ user: data.nick, message: data.message });
});

//when a new user event is detected
socket.on("new user", function (data) {
  data.map(function (user) {
    return addToUsersBox(user);
  });
});

//when a user leaves
socket.on("user disconnected", function (userName) {
  toastBody.textContent = `${userName} has left the chat`
  bsAlert.show()
  document.querySelector(`.${userName}-userlist`).remove();
});

// Socket typing listener to present user is typing data on screen
socket.on('typing', function (data) {
  if (data.typing == true) {
    isTypingContainer.textContent = `${data.user} is typing...`;
  } else {
    isTypingContainer.textContent = "";
  }
})

