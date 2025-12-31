import{
  CoverPage
} from "../../MongoDB/dbConnectionController.js"

export const getCoverPageOverview = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await CoverPage.findById(id);

    if (!record) {
      return res.status(404).json({ message: 'Cover Page record not found' });
    }

    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching cover page overview:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};