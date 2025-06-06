document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Send mailbox 
  document.querySelector("#compose-form").onsubmit = () => {
    let recpitients = document.querySelector('#compose-recipients')
    let subject = document.querySelector("#compose-subject")
    let body = document.querySelector("#compose-body")

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recpitients.value.trim(),
        subject: subject.value.trim(),
        body: body.value.trim()
      })
    })
      .then(response => response.json())
      .then(result => {
        // Print result
        console.log(result);
      });

    recpitients.value = '';
    subject.value = '';
    body.value = '';
    return false;
  }

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  // Hide the Full email by removing the #mail-container innerHTML
  document.querySelector("#mail-container").innerHTML = '';

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch all emails
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
       for (let email of emails) {
        const mailDiv = document.createElement("div");
        mailDiv.className = "mail-div";
        mailDiv.innerHTML = `
          <strong class="mail-sender">${email.sender}</strong>
          <span class="mail-subject">${email.subject}</span>
          <span class="mail-timestamp">${email.timestamp}</span>
        `;
        document.querySelector("#emails-view").append(mailDiv);

        // Styling based on read status
        mailDiv.classList.add(email.read ? "read" : "unread");

        // On click: show full email
        mailDiv.addEventListener('click', () => {
          document.querySelector('#emails-view').style.display = 'none';

          const fullMail = document.createElement("div");
          fullMail.classList.add("full-mail");

          // Fetch full email
          fetch(`/emails/${email.id}`)
            .then(response => response.json())
            .then(email => {
              let archiveLabel = email.archived ? "Unarchive" : "Archive";
              let archiveBtnHtml = "";
              let replyBtnHtml = "";

              if (mailbox !== "sent") {
                archiveBtnHtml = `<button class="archive-btn btn btn-sm btn-outline-primary">${archiveLabel}</button>`;
                replyBtnHtml = `<button class="reply-btn btn btn-sm btn-outline-primary">Reply</button>`;
              }

              fullMail.innerHTML = `
                <button class="back-btn btn btn-sm btn-outline-primary">Back</button>
                ${archiveBtnHtml}
                <p><strong>From:</strong> ${email.sender}</p>
                <p><strong>To:</strong> ${email.recipients}</p>
                <p><strong>Subject:</strong> ${email.subject}</p>
                ${replyBtnHtml}
                <hr>
                ${email.body}
              `;

              document.querySelector("#mail-container").append(fullMail);

              // Mark email as read
              fetch(`/emails/${email.id}`, {
                method: 'PUT',
                body: JSON.stringify({ read: true })
              });

              // Back button
              document.querySelector(".back-btn").addEventListener('click', () => {
                load_mailbox(mailbox);
              });

              // Archive/Unarchive
              if (mailbox !== "sent") {
                document.querySelector(".archive-btn").addEventListener('click', () => {
                  fetch(`/emails/${email.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ archived: !email.archived })
                  })
                    .then(() => {
                      load_mailbox('inbox');
                    });
                });

                // Reply button
                document.querySelector(".reply-btn").addEventListener('click', () => {
                  fullMail.style.display = "none";
                  compose_email();

                  document.querySelector('#compose-recipients').value = email.sender;
                  document.querySelector('#compose-subject').value =
                    email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
                  document.querySelector('#compose-body').value =
                    `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
                });
              }
            });
        });
      }
    });
}