import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Function to fetch data from the API
const fetchSingleSheetData = async () => {
    const { data } = await axios.get('http://localhost:3000/properties-data');
    return data;
};

// Custom hook to use the query
const useFetchSingleSheetData = () => {
    return useQuery({
        queryKey: ['singleSheetData'],
        queryFn: fetchSingleSheetData,
    });
};

export default useFetchSingleSheetData;
