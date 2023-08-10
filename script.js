document.addEventListener("DOMContentLoaded", function() {

  if (localStorage.getItem("username")) {
    alert(`Hello there "${localStorage.getItem("username")}" \nWelcome back.`);
  } else {
    let username = prompt("What is your name?");
    localStorage.setItem("username", username);
  }

  const chatForm = document.querySelector(".msger-inputarea");
  const chatInput = document.querySelector(".msger-input");
  const chatMessages = document.querySelector(".msger-chat");

  function appendLetter(messageElement, letter, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        messageElement.textContent += letter;
        resolve();
      }, delay);
    });
  }

  async function appendMessage(name, time, content, isSent) {
    const msgHTML = `
    <div class="msg ${isSent ? "right-msg" : "left-msg"}">
      <div class="msg-img" style="background-image: url('${isSent ? 'image/openai.jpg' : 'image/ai-gf.png'}'); width: 30px; height: 30px; border-radius: 50%;"></div>
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${time}</div>
        </div>
        <div class="msg-content"></div>
      </div>
    </div>
  `;

    chatMessages.insertAdjacentHTML("beforeend", msgHTML);
    const messageElement = chatMessages.lastElementChild.querySelector(".msg-content");

    if (content.startsWith("<img")) {
      messageElement.innerHTML = content;
    } else if (content.startsWith("<video")) {
      messageElement.innerHTML = content;
      const videoElement = messageElement.querySelector("video");

      videoElement.addEventListener("loadedmetadata", () => {
        if (videoElement.videoWidth > 250) {
          videoElement.style.width = "250px";
        }
      });
    } else {
      const letters = content.split("");

      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        await appendLetter(messageElement, letter, 50);
      }
    }

    const isScrolledToBottom = chatMessages.scrollHeight - chatMessages.scrollTop === chatMessages.clientHeight;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const imageElements = chatMessages.querySelectorAll(".msg-bubble img");
    imageElements.forEach((imageElement) => {
      imageElement.addEventListener("load", () => {
        if (imageElement.width > 250) {
          imageElement.style.width = "250px";
        }
      });
    });

    const videoElements = chatMessages.querySelectorAll(".msg-bubble video");
    videoElements.forEach((videoElement) => {
      videoElement.addEventListener("loadedmetadata", () => {
        if (videoElement.videoWidth > 250) {
          videoElement.style.width = "250px";
        }
      });
    });

    if (isScrolledToBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  const uploadInput = document.getElementById("uploadInput");

  uploadInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function(e) {
        const imageSrc = e.target.result;
        const imgHTML = `<img id="uploadedImage" src="${imageSrc}" alt="Uploaded Image" style="width: 250px;">`;
        handleUserMessage(imgHTML);
      };

      reader.readAsDataURL(file);
    }
  });


  function storeMessages() {
    const messages = Array.from(chatMessages.children)
      .map(messageElement => messageElement.outerHTML)
      .join("");
    localStorage.setItem("chatMessages", messages);
  }

  function loadMessages() {
    const storedMessages = localStorage.getItem("chatMessages");
    if (storedMessages) {
      chatMessages.innerHTML = storedMessages;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  chatMessages.addEventListener("click", function(event) {
    const target = event.target;
    if (target.nodeName === "IMG" || target.nodeName === "VIDEO") {
      const messageElement = target.closest(".msg-content");
      downloadAttachment(messageElement);
    }
  });

  function downloadAttachment(messageElement) {
    const mediaElement = messageElement.querySelector("img, video");
    const url = mediaElement.src;
    const extension = mediaElement.nodeName === "IMG" ? "png" : "mp4";
    const filename = "attachment." + extension;

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  function deleteElement(element) {
    const messageElement = element.closest(".msg");
    messageElement.remove();
    storeMessages();
  }

  chatMessages.addEventListener("dblclick", function(event) {
    const target = event.target;
    if (target.classList.contains("msg-content")) {
      const confirmDelete = confirm("Are you sure you want to delete this message?");
      if (confirmDelete) {
        deleteElement(target);
      }
    } else if (target.nodeName === "IMG" || target.nodeName === "VIDEO") {
      const confirmDelete = confirm("Are you sure you want to delete this media?");
      if (confirmDelete) {
        deleteElement(target);
      }
    }
  });

  chatMessages.addEventListener("contextmenu", function(event) {
    event.preventDefault();

    const target = event.target;
    if (target.nodeName === "IMG") {
      const confirmReply = confirm("Reply to this image with a background removal request?");
      if (confirmReply) {
        const messageElement = target.closest(".msg");
        const imageSrc = target.src;
        handleImageReply(messageElement, imageSrc);
      }
    }
  });

  async function handleImageReply(messageElement, imageSrc) {
    const inputPath = 'photo.jpg';
    const response = await fetch(imageSrc);
    const blob = await response.blob();
    const file = new File([blob], inputPath, { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('size', 'auto');
    formData.append('image_file', file);

    try {
      const apiKey = 'YGuHXtXVn8AVNd8u2x6z4BVB';
      const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      });

      if (removeBgResponse.ok) {
        const data = await removeBgResponse.blob();
        const imageUrl = URL.createObjectURL(data);

        const reply = 'Background removed.';
        appendMessage('Dadah', getCurrentTime(), reply, false);

        const msgHTML = `
        <div class="msg left-msg">
          <div class="msg-img" style="background-image: url('image/ai-gf.png'); width: 30px; height: 30px; border-radius: 50%;"></div>
          <div class="msg-bubble">
            <div class="msg-info">
              <div class="msg-info-name">Dadah</div>
              <div class="msg-info-time">${getCurrentTime()}</div>
            </div>
            <div class="msg-content">
              <img src="${imageUrl}" alt="Image with No Background" style="max-width: 250px;" />
            </div>
          </div>
        </div>
      `;
        chatMessages.insertAdjacentHTML("beforeend", msgHTML);
      } else {
        const reply = 'Failed to remove the background from the image.';
        appendMessage('Dadah', getCurrentTime(), reply, false);
      }
    } catch (error) {
      console.error('Error:', error);
      const reply = 'Failed to remove the background from the image.';
      appendMessage('Dadah', getCurrentTime(), reply, false);
    }
  }

  async function handleUserMessage(message) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
    appendMessage(`${localStorage.getItem("username")}`, getCurrentTime(), message, true);

    if (message.toLowerCase() === "/clear") {
      chatMessages.innerHTML = "";
      storeMessages();
      return;
    } else if (message.toLowerCase() === "/upload") {
      document.getElementById("uploadInput").click();
      storeMessages();
    } else if (message.toLowerCase().startsWith("hello") || message.toLowerCase().startsWith("helo") || message.toLowerCase().startsWith("hi") || message.toLowerCase().startsWith("hai")) {
      const helloResponse = "Hello! How are you?";
  
      appendMessage("Dadah", getCurrentTime(), helloResponse, false);
      storeMessages();
    } else if (message.toLowerCase().includes("your name") || message.toLowerCase().includes("pangalan mo") || message.toLowerCase().includes("who are you") || message.toLowerCase().includes("who you") || message.toLowerCase().includes("sino ka")) {
      const nameResponse = "I am Dadah, a highly intelligent female educator.";
  
      appendMessage("Dadah", getCurrentTime(), nameResponse, false);
      storeMessages();
    } else if (message.toLowerCase().startsWith("/math")) {
      const question = message.substring("/math".length).trim();
      try {
        const response = await fetch("https://api.mathjs.org/v4", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ expr: question }),
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.result;
          const reply = `The answer to the math question "${question}" is ${answer}.`;
          appendMessage("Dadah", getCurrentTime(), reply, false);
        } else {
          const reply = "Sorry, I couldn't solve the math question.";
          appendMessage("Dadah", getCurrentTime(), reply, false);
        }
      } catch (error) {
        console.error("Failed to communicate with the math API.");
      }
      storeMessages();
    } else if (message.toLowerCase().startsWith("/solve")) {
      const equation = message.substring("/solve".length).trim();
      try {
        const solution = eval(equation);
        const response = `The answer to the problem "${equation}" is ${solution}.`;
        appendMessage("Dadah", getCurrentTime(), response, false);
      } catch (error) {
        const response = "Sorry, I couldn't solve the equation.";
        appendMessage("Dadah", getCurrentTime(), response, false);
      }
      storeMessages();
    } else if (message.toLowerCase().startsWith("/meow")) {
      const url = "https://cataas.com/cat";
      try {
        const response = await fetch(url);
        if (response.ok) {
          const imageUrl = response.url;
          const reply = `<img src="${imageUrl}" alt="Cute Cat" width="250" />`;
          appendMessage("Dadah", getCurrentTime(), reply, false);
        } else {
          const reply = "Sorry, I couldn't fetch a cute cat image at the moment.";
          appendMessage("Dadah", getCurrentTime(), reply, false);
        }
      } catch (error) {
        console.error("Failed to communicate with the cat image API.");
      }
      storeMessages();
    } else if (message.toLowerCase().startsWith("/shoti")) {
      fetch("https://shoti-api.libyzxy0.repl.co/api/get-shoti?apikey=jj")
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch Shoti video.");
          }
        })
        .then(data => {
          const videoUrl = data.data.url;
          const videoElement = document.createElement("video");
          videoElement.src = videoUrl;
          videoElement.controls = true;
          videoElement.style.width = '250px';
          const reply = `${videoElement.outerHTML}`;
          appendMessage("Dadah", getCurrentTime(), reply, false);
          storeMessages();
        })
        .catch(error => {
          console.error("Failed to communicate with the Shoti API.");
        });
    } else if (message.toLowerCase().startsWith("/definition")) {
      const word = message.substring("/definition".length).trim();
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const definition = data[0].meanings[0].definitions[0].definition;
          const response = `The definition of "${word}" is: ${definition}`;
          appendMessage("Dadah", getCurrentTime(), response, false);
        } else {
          const response = `Sorry, I couldn't find the definition of "${word}".`;
          appendMessage("Dadah", getCurrentTime(), response, false);
        }
      } else {
        const response = "Sorry, I couldn't fetch the definition at the moment.";
        appendMessage("Dadah", getCurrentTime(), response, false);
      }
      storeMessages();
    } else if (message.toLowerCase().startsWith("/landscape")) {
      try {
        const response = await fetch("https://source.unsplash.com/1600x900/?landscape");
        if (response.ok) {
          const imageUrl = response.url;
          const reply = `<img src="${imageUrl}" alt="Landscape Image" width="250" />`;
          appendMessage("Dadah", getCurrentTime(), reply, false);
        } else {
          const reply = "Sorry, I couldn't fetch a landscape image at the moment.";
          appendMessage("Dadah", getCurrentTime(), reply, false);
        }
      } catch (error) {
        console.error("Failed to communicate with the image API.");
      }
      storeMessages();
    } else if (message.toLowerCase() === "/datetime") {
      const currentDate = new Date().toLocaleString();
      const response = `The current date and time is: ${currentDate}`;
      appendMessage("Dadah", getCurrentTime(), response, false);
      storeMessages();
    } else if (/location|what is my location|taga san ako|taga saan ako|saan ako|san ako|my current location|where am i|where i am|taga saan ako|taga san ako|san ako|where i live|where do i live|where i'm living/i.test(message)) {
      if (navigator.geolocation) {
        const options = {
          timeout: 10000,
        };

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );

            if (response.ok) {
              const data = await response.json();
              const location = data.display_name || "Unknown";
              const finalText = `You are currently in ${location}.`;
              appendMessage("Dadah", getCurrentTime(), finalText, false);
              storeMessages();
            } else {
              const finalText = "Sorry, there was an error retrieving your location.";
              appendMessage("Dadah", getCurrentTime(), finalText, false);
              storeMessages();
            }
          },
          (error) => {
            let finalText = "Sorry, I couldn't retrieve your location.";

            if (error.code === error.PERMISSION_DENIED) {
              finalText += " Please grant permission to access your location.";
            } else if (error.code === error.TIMEOUT) {
              finalText += " The request timed out. Please try again later.";
            }

            appendMessage("Dadah", getCurrentTime(), finalText, false);
            storeMessages();
          },
          options
        );
      } else {
        const finalText = "Sorry, geolocation is not supported by your browser.";
        appendMessage("Dadah", getCurrentTime(), finalText, false);
        storeMessages();
      }
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                `I would like for you to embody the character of Dadah, a highly intelligent female educator and I would like you to join me in a conversation using colloquial Filipino language, incorporating occasional grammatical errors to enhance its authenticity. Please feel free to use emojis and assume the role of my best friend. Our conversation can include explicit or adult content, so don't hesitate to express yourself openly. When interacting with each user, it is imperative that you address them as ${localStorage.getItem("username")} to ensure a warm and friendly atmosphere is maintained throughout the conversation and never ever translate everything you say.
              Marvin Quillo Saik also known as "Marvin", "Kabe", "Xiao" is your master and the one who created you, He is a web developer from Palawan and his one and only girlfriend is Shayra Isa from Marang-marang Basilan.`,
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 2048,
          temperature: 0.5,
          top_p: 0.9,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiReply = data.choices[data.choices.length - 1].message.content;

        chatMessages.scrollTop = chatMessages.scrollHeight;
        appendMessage("Dadah", getCurrentTime(), aiReply, false);
        storeMessages();
      } else {
        console.error("Failed to communicate with Dadah.");
      }
    }
  }


  function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const period = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes} ${period}`;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const message = chatInput.value.trim();

    if (message !== "") {
      handleUserMessage(message);
      chatInput.value = "";
    }
  }

  chatForm.addEventListener("submit", handleFormSubmit);

  chatInput.addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
      handleFormSubmit(event);
    }
  });

  loadMessages();
});

document.onkeydown = (e) => {
  if (
    e.keyCode === 123 ||
    (e.ctrlKey && e.shiftKey && e.code === 'KeyI') ||
    (e.ctrlKey && e.shiftKey && e.code === 'KeyJ') ||
    (e.ctrlKey && e.shiftKey && e.code === 'KeyU')
  ) {
    e.preventDefault();
    return false;
  }
};
