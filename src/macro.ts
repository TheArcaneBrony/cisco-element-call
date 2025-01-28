import { XAPI } from "jsxapi";

// FOR MACRO: import xapi from 'xapi';
export async function run(deviceApi: XAPI) {
  const meetingDomain = "call.element.io";

  const KEYBOARD_TYPES = {
    NUMERIC: "Numeric",
    SINGLELINE: "SingleLine",
    PASSWORD: "Password",
    PIN: "PIN",
  };

  const MEETING_ID = "meetingID";

  /* This will be the Panel/Widget ID you are using in the UI Extension */
  const INROOMCONTROL_AUDIOCONTROL_PANELID = "ElementCallButton";

  /* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */
  const REGEXP_NUMERICDIALER = /^([0-9]{3,10})$/;

  function getMeetingID(text: string, value = "") {
    deviceApi.Command.UserInterface.Message.TextInput.Display({
      InputType: KEYBOARD_TYPES.SINGLELINE,
      Placeholder: `No need to type :${meetingDomain}`,
      Title: "Join meeting via Element Call",
      Text: text,
      InputText: value,
      SubmitText: "Join",
      FeedbackId: MEETING_ID,
    }).catch((error: any) => console.error(error));
  }

  /* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
  deviceApi.Event.UserInterface.Extensions.Panel.Clicked.on((event: any) => {
    if (event.PanelId === INROOMCONTROL_AUDIOCONTROL_PANELID) {
      getMeetingID("Enter the meeting id from your invite:");
    }
  });

  /* Event listener for the dial pad being posted */
  deviceApi.Event.UserInterface.Message.TextInput.Response.on((event: any) => {
    switch (event.FeedbackId) {
      case MEETING_ID:
        /* Change this to whatever filter you want to check for validity */
        /*const regex = REGEXP_NUMERICDIALER;
                const match = regex.exec(event.Text);

                if (match) {
                    const meetingID = match[1];
                    const at = meetingDomain.startsWith('@') ? '' : '@';
                    const Number = meetingID + at + meetingDomain;
                    console.log('Dial:', Number);

                    //xapi.Command.Dial({ Number });
                } else {
                    getMeetingID("You typed in an invalid number. Please try again.", event.Text);
                }*/
        break;
    }
  });

  // Register button:
  async function registerHomeButton() {
    const xml = `<?xml version="1.0"?>
  <Extensions>
    <Version>1.7</Version>
    <Panel>
      <Order>1</Order>
      <PanelId>${INROOMCONTROL_AUDIOCONTROL_PANELID}</PanelId>
      <Origin>local</Origin>
      <Type>Statusbar</Type>
      <Icon>Language</Icon>
      <Color>#07C1E4</Color>
      <Name>Element Call</Name>
      <ActivityType>Custom</ActivityType>
    </Panel>
  </Extensions>`;
    console.log(xml);

    await deviceApi.Command.UserInterface.Extensions.Panel.Save(
      {
        PanelId: INROOMCONTROL_AUDIOCONTROL_PANELID,
      },
      xml,
    );
  }

  await registerHomeButton();
}

async function getMatrixServerDomain() {}

// FOR MACRO: -- NOTE: no top level await!
//run(xapi).catch()
