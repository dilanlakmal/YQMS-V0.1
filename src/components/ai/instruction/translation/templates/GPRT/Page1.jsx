import GPRT_FIRST_PAGE_DATA from "../../data/GPRT/FirstPage";
import EditWord from "../../../../utils/EditWord";
import { splitChineseWords } from "../../../../../../utils/segmenter";


const FirstPage = ({
    editable,
    step
}) => {

    const title = GPRT_FIRST_PAGE_DATA.header.content.title.values;
    const content = GPRT_FIRST_PAGE_DATA.header.content;
    const titleInfo = GPRT_FIRST_PAGE_DATA.header.content.infoTable;
    const hightLightInfo = GPRT_FIRST_PAGE_DATA.header.content.highlightRow;

    const productionSpecifications = GPRT_FIRST_PAGE_DATA.tables;

    const notes = GPRT_FIRST_PAGE_DATA.note.content.texts;

    const stamp = GPRT_FIRST_PAGE_DATA.stamp;

    const originLang = GPRT_FIRST_PAGE_DATA.meta.originLang;
    const currentLang = GPRT_FIRST_PAGE_DATA.meta.currentLang;

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

    return (
        <table  className="table-auto md:table-fixed border-collapse border border-black border-3 w-full text-center">
            <thead >
                <tr>
                    <th colSpan={2} className="p-4">
                        {/* <EditWord word={title.left[originLang].value} /> */}
                        {renderContentByStep (title.left[originLang].value)}
                    </th>
                    <th colSpan={2} className="p-4">
                        {
                        // splitChineseWords(title.right[originLang].value).map((word, index) => (
                        //     <EditWord key={index} word={word} />
                        // ))
                        renderContentByStep (title.right[originLang].value)
                        }
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td rowSpan={titleInfo.rows.length} colSpan={2} className="border border-black border-3 p-2">
                        <img alt={content.image.id} src={content.image.value} />
                    </td>
                    <td className="border border-black border-3 p-2">
                        {
                        // splitChineseWords(titleInfo.rows[0].label[originLang]).map((t, idx) => (
                        // <EditWord word={t} key={idx} />
                        // ))
                        renderContentByStep (titleInfo.rows[0].label[originLang])
                        }
                    </td>
                    <td className="border border-black border-3 p-2">
                        {
                        // splitChineseWords(titleInfo.rows[0].value[originLang]).map((t, idx) => (
                        // <EditWord word={t} key={idx} />
                        // ))
                            renderContentByStep (titleInfo.rows[0].value[originLang])
                        }
                    </td>
                </tr>

                {
                    titleInfo.rows.slice(1).map((title, i) => (
                        <tr key={i + 1}>
                            <td className="border border-black border-3 p-2">
                                {
                                    // splitChineseWords(title.label[originLang]).map((t, idx) => (
                                    // <EditWord word={t} key={idx} />
                                    // ))
                                    renderContentByStep (title.label[originLang])
                                }
                            </td>
                            <td className="border border-black border-3 p-2">
                                {
                                    // splitChineseWords(title.value[originLang]).map((t, idx) => (
                                    // <EditWord word={t} key={idx} />
                                    // ))
                                    renderContentByStep (title.value[originLang])
                                }
                            </td>
                        </tr>
                ))
                }   
                <tr>
                    {
                        hightLightInfo.cells.map((c, i) => (
                            <td className="border border-black border-3" key={i}>
                                {
                                    // splitChineseWords(c.value[originLang]).map((w, idx) => (
                                    //     <EditWord word={w} key={idx} />
                                    // ))
                                    renderContentByStep (c.value[originLang])
                                }
                            </td>
                        ))
                    }
                </tr>
                <tr>
                    <td colSpan={3} className="text-start pl-2">
                        {
                            notes.map((note, idx) => (
                                <p key={idx}>
                                    {
                                        // splitChineseWords(note[originLang]).map((w,  i) => (
                                        //     <EditWord word={w} key={i} />
                                        // ))
                                        renderContentByStep (note[originLang])
                                    }
                                </p>
                            ))
                        }                    
                    </td>
                </tr>   
                {
                    Object.values(productionSpecifications).map((prod, i) => (
                    <tr key={i}>
                        <td colSpan={4} className="p-2">
                            <ProductionSpecific table={prod} originLang={originLang} renderContentByStep ={renderContentByStep }/>
                        </td>
                    </tr>  
                    ))
                }
                <tr>
                    <td colSpan={3}></td>
                    <td  className="text-start p-5 pt-20">
                        <img src={stamp.image.src} alt="Stamp from customer"/>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

const ProductionSpecific = ({table, originLang, renderContentByStep }) => {
    console.log(table)
    const header = table.heads;
    const rows = table.rows;
    return (
        <table className="table-auto text-center">
            <thead>
                {
                    header.map((h, i) => (
                        <th key={i} className="border border-black border-3">
                            {
                                // splitChineseWords(h[originLang]).map((w, i) => (
                                //     <EditWord word={w} key={i} />
                                // ))
                                renderContentByStep (h[originLang])
                            }
                        </th>
                    ))
                }
            </thead>
            <tbody>
                {
                    rows.map((cols, i) => (
                        <tr key={i}>
                            {
                                cols.map((cell, i) => (
                                    <td key={i} colSpan={cell.colSpan} className="border border-black border-3">
                                        {
                                            // splitChineseWords(cell[originLang]).map((w, i) => (
                                            //     <EditWord word={w} key={i}/>
                                            // ))
                                            renderContentByStep (cell[originLang])
                                        }
                                    </td>
                                ))
                            }
                        </tr>
                    ))
                }                
            </tbody>


        </table>
    )
}
export default FirstPage;