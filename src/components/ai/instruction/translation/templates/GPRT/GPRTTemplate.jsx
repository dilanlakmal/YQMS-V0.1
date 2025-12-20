import FirstPage from "./Page1";
import Page2 from "./Page2";
import Page3 from "./Page3";
import Page from "../../../../utils/Page";
function GPRTTemplate({ editable, step }) {
  return (
    <div className="flex flex-col items-center w-fit">
      <Page>
        <FirstPage
          editable={editable}
          step={step}
        />
      </Page>

      <Page>
        <Page2
          editable={editable}
          step={step}
        />
      </Page>

      <Page>
        <Page3 />
      </Page>
    </div>
  );
}

export default GPRTTemplate;


