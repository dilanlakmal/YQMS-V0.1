
import EditWord from "../../../../utils/EditWord";
import Page2Data from "../../data/GPRT/Page2";

const Page2 = ({editable, step}) => {
    const renderContentByStep  = (input) => {
        const state = step.toLowerCase();
        if (state) {
            switch (state) {
                case "preview":
                    return <EditWord word={input} />
                case "glossary":
                    return (
                        splitChineseWords(input).map((w, i) => (
                            <EditWord key={i} word={w} />
                        ))
                    )
                case "complete": 
                    return (
                        <p>{input}</p>
                    )
                default:
                    return input
            }
        }
        return (
            <p>-</p>
        )
    };

    const data = Page2Data;
    const originLang = data.originLang;

    const header = data.header;
    
    return (
        <div className="">
        <header className="pt-10">
            <table className="table-auto text-xs">
                <thead>
                    <tr className="border-t border-black border-3">
                        <td rowSpan={2} colSpan={2} className="border border-3 border-black p-2 text-xl">
                            {"REITMANS"}
                        </td>
                        <td colSpan={2} className="border-t  border-3 border-black p-2">
                            {"Style ID:"}
                        </td>      
                        <td className="border-t  border-3 border-black p-2">
                            {"W02"}
                        </td>
                        <td className="border-t  border-3 border-black p-2">
                            {"short Desc:"}
                        </td> 
                        <td className="border-t  border-3 border-black p-2">
                            {"F-DRy"}
                        </td> 
                        <td>
                        </td>         
                        <td  className="border-t  border-3 border-black p-2">
                            {"Depart"}
                        </td>     
                        <td colSpan={3} className="border-t  border-r border-3 border-black p-2">
                            {"310 Women"}
                        </td>  
                    </tr>
                    <tr>
                        <td className="border-b   border-3 border-black p-2">
                            {"Initial DC Date:"}
                        </td>
                        <td>
                            
                        </td>
                        <td className="border-b   border-3 border-black p-2">
                            {"06-25-2025"}
                        </td>
                        <td className="border-b   border-3 border-black p-2">
                            {"Commodity:"}
                        </td>
                        <td colSpan={2} className="border-b   border-3 border-black p-2">
                            {"T-shirt / Camis"}
                        </td>
                        <td className="border-b   border-3 border-black p-2">
                            {"Season:"}
                        </td>
                        <td colSpan={2} className="border-b border-r  border-3 border-black p-2">
                            {"Fall 2025 Apparel Womens RW &CO."}
                        </td>
                    </tr>

                </thead>
                <tbody>
                    <tr className="border-r border-t border-l border-black border-3 text-start text-sm">
                        <td >
                            {"Style Status:"}
                        </td>
                        <td>

                        </td>
                        <td colSpan={3}>
                            {"In Work"}
                        </td>
                        <td colSpan={2}>
                            {"3D Vendor:"}
                        </td>
                        <td colSpan={1}>
                            {"No"}
                        </td>
                        <td rowSpan={2} colSpan={3} className="border border-3 border-black">
                            <img src="" alt="T-shirt"/>
                        </td>
                        
                    </tr>
                    <tr className="border-b border-l border-r border-black border-3">
                        <td>
                            {"Long Description"}
                        </td>
                        <td>

                        </td>
                        <td colSpan={6}>
                            {"F- DRY VISCOSE CREW NECK KNIT T-SHIRT"}
                        </td>
                    </tr>
                    <tr className="border-l border-r border-black border-3 text-sm text-start">
                        <td>
                            Final Fit
                            Approval
                            Date
                        </td>
                        <td>

                        </td>
                        <td>
                            Size range
                        </td>
                        <td >
                            XXS, SX, S, M, L, XL, XXL
                        </td>
                        <td>
                            Target Cost:
                        </td>
                        <td>
                            0 USD
                        </td>
                        <td>
                            Target
                            Units:
                        </td>
                        <td>
                            3200
                        </td>
                        <td>
                            # Planned 0 colors:
                        </td>
                        <td>
                            # of Deliv:
                        </td>
                        <td>
                            0
                        </td>
                    </tr>
                    <tr className="border-b border-r border-l border-3 border-black">
                        <td>
                            Fit Type:
                        </td>
                        <td>
                            Regular
                        </td>
                    </tr>
                </tbody>
            </table>
        </header>
        <section className="mt-10 border border-3 border-black w-full">
            <img src="" alt="T-shirt details"/>
        </section>
        </div>
    )

}

export default Page2;