import {XAPI} from "jsxapi";
import {log} from "node:console";

// FOR MACRO: import xapi from 'xapi';
export async function run(deviceApi: XAPI) {
    //#region Configuration
    // const elementCallDomain = "call.element.io";
    const elementCallDomain = "ec.rory.gay";
    const displayName = "Room Kit Mini";

    // FOR MACRO: Obtain from client devtools -> Storage -> Local Storage -> "matrix-auth-store"
    //@ts-ignore
    const clientAuth: MatrixClientAuth = global.clientAuth;
    // Optionally: hardcode value if needed
    const matrixHomeserverBaseUrl = await getMatrixServerDomain(elementCallDomain);
    //#endregion

    //#region Constants

    /* This will be the Panel/Widget ID you are using in the UI Extension */
    const INROOMCONTROL_AUDIOCONTROL_PANELID = "ElementCallButton";

    /* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */
    const REGEXP_NUMERICDIALER = /^([0-9]{3,10})$/;

    //#endregion

    // function getMeetingID(text: string, value = "") {
    //     deviceApi.Command.UserInterface.Message.TextInput.Display({
    //         InputType: KEYBOARD_TYPES.SINGLELINE,
    //         Placeholder: `No need to type :${elementCallDomain}`,
    //         Title: "Join meeting via Element Call",
    //         Text: text,
    //         InputText: value,
    //         SubmitText: "Join",
    //         FeedbackId: MEETING_ID,
    //     }).catch((error: any) => console.error(error));
    // }


    function getText(info: Partial<InputPrompt>): Promise<string> {
        return new Promise((resolve, reject) => {
            const feedbackId = Math.random().toString();
            deviceApi.Command.UserInterface.Message.TextInput.Display(
                {
                    InputType: info.InputType ?? KeyboardTypes.SINGLELINE,
                    Placeholder: info.Placeholder ?? "",
                    Title: info.Title ?? "",
                    Text: info.Description ?? "",
                    InputText: info.DefaultValue ?? "",
                    SubmitText: info.SubmitText ?? "OK",
                    FeedbackId: feedbackId
                }
            ).catch((error: any) => console.error(error));
            deviceApi.Event.UserInterface.Message.TextInput.Response.once(async (event: any) => {
                if (event.FeedbackId == feedbackId) {
                    resolve(event.Text);
                } else reject("Got out of order getText response!");
            });
        })
    }

    /* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
    deviceApi.Event.UserInterface.Extensions.Panel.Clicked.on(async (event: any) => {
        if (event.PanelId === INROOMCONTROL_AUDIOCONTROL_PANELID) {
            const serverDomain = new URL(await getMatrixServerDomain(elementCallDomain)).host;
            const alias = await getText({
                Title: "Enter call name",
                Description: `No need to type :${serverDomain}`,
                Placeholder: "my-awesome-call",
            });
            console.log(alias);
            const roomId = await getText({
                Title: "Enter room ID",
                Description: "... or press Next is a value is already there",
                DefaultValue: await tryResolveRoomAlias(`#${alias}:${serverDomain}`) ?? undefined
            });
            const roomEncryptionEnabled = await checkEncryptionEnabled(roomId);
            const password = await getText({
                Title: "Call password/pin",
                Description: `Call may require password/pin: ${!roomEncryptionEnabled}`,
                Placeholder: "Call password..."
            });

            let url = `https://${elementCallDomain}/room/#/`
                + `?displayName=${encodeURIComponent(displayName)}`
                // + `&appPrompt=false`
                // + `&skipLobby=true`
                // + `&returnToLobby=false`
                // + `&showControls=false`
                // + `&hideHeader=true`
                + `&isHeadless=true`;
            if (password) url += `&password=${encodeURIComponent(password)}`;
            url += `&roomId=${roomId}`

            console.log("Opening page: ", url)
            await deviceApi.Command.UserInterface.WebView.Display({
                Url: url,
            });
        }
    });

    /* Event listener for the dial pad being posted */
    // deviceApi.Event.UserInterface.Message.TextInput.Response.on((event: any) => {
    //   switch (event.FeedbackId) {
    //     case MEETING_ID:
    //
    //       break;
    //   }
    // });

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


    //#region Basic HTTP wrappers
    async function httpGet(uri: string, headers: string[] = []) {
        log("Sending matrix GET:", uri)
        const res = await deviceApi.Command.HttpClient.Get({
            Url: uri,
            Header: headers,
            //ResultBody: "PlainText"
        });
        return JSON.parse(res.Body);
    }

    //#endregion

    //#region Matrix API
    async function mxHttpGet(uri: string){
        //const server = await getMatrixServerDomain(elementCallDomain);
        return await httpGet(`${matrixHomeserverBaseUrl}${uri}`, [`Authorization: Bearer ${clientAuth.access_token}`])
    }

    async function getMatrixServerDomain(ecInstance: string) {
        const ecConfig = await httpGet(`https://${ecInstance}/config.json`);
        const serverDomain = ecConfig.default_server_config["m.homeserver"].base_url;
        console.log(`Resolved ${ecInstance}'s server domain to be ${serverDomain}`);
        return serverDomain;
    }

    async function createRoomWithAlias(name: string, alias: string) {

    }

    async function tryResolveRoomAlias(alias: string): Promise<string | null> {
        const encodedAlias = encodeURIComponent(alias);
        try {
            // const res = await httpGet("https://matrix.rory.gay/_matrix/client/v3/directory/room/" + encodeURIComponent("#proxmox:envs.net"));
            const res = await mxHttpGet(`/_matrix/client/v3/directory/room/${encodedAlias}`);
            log(res);
            return res.room_id;
        } catch (e: any) {
            log(e);
            return null;
        }
    }

    async function checkEncryptionEnabled(roomId: string) {
        const encodedRoomId = encodeURIComponent(roomId);
        try {
            const res = await mxHttpGet(`/_matrix/client/v3/room/${encodedRoomId}/state/m.room.encryption/`);
            return true;
        } catch (e) {
            return false;
        }
    }

    async function checkMatrixAuth(){
        try {
            const res = await mxHttpGet(`/_matrix/client/v3/account/whoami`);
            log(res);
            return !!res.user_id;
        }
        catch {
            return false;
        }
    }

    //#endregion


    await registerHomeButton();
    //await tryResolveRoomAlias("#cisco:call.ems.host");
    console.log("Matrix auth valid:", await checkMatrixAuth());
    await deviceApi.Command.UserInterface.WebView.Clear();

}


//#region Types
interface InputPrompt {
    InputType: KeyboardTypes,
    Placeholder: string,
    Title: string, // Title
    Description: string, // Description
    DefaultValue: string, // default value
    SubmitText: string, // OK button
}

enum KeyboardTypes {
    NUMERIC = "Numeric",
    SINGLELINE = "SingleLine",
    PASSWORD = "Password",
    PIN = "PIN",
}

interface MatrixClientAuth {
    user_id: string,
    device_id: string,
    access_token: string,
    passwordlessUser: boolean,
    tempPassword: string
}

//#endregion

// FOR MACRO: -- NOTE: no top level await!
//run(xapi).catch()

