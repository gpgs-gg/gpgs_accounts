import React, { useState } from "react";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import useFetchSingleSheetData from "./Server";
// import { TailSpin } from 'react-loader-spinner'; // Optional: for loading spinner

const DueAmounts = () => {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [result, setResult] = useState(null);

  const { data: fetchSingleSheetData, error, isLoading, isError } = useFetchSingleSheetData();
    console.log("fetchSingleSheetData" , fetchSingleSheetData)
  // Handle form submission
  const onSubmit = (formData) => {
    const { selectedProperty } = formData;

    const selectedData = fetchSingleSheetData?.find((item) => item.id === selectedProperty.value);

    if (selectedData) {
      // Perform your dynamic calculation logic here
      const calculatedValue = selectedData.value * 2;
      setResult(calculatedValue);
    }
  };

  // Prepare options for react-select (use actual data from API)
  const options = fetchSingleSheetData?.data?.map((item) => ({
    value: item["PG Main Sheet ID"],
    label: item["Property Code"],   
  } 
)) || [];  

// Male PG / Female PG
  // Custom styles for the Select component
  const customStyles = {
    control: (styles) => ({
      ...styles,
      backgroundColor: '#FFF3E0',
      borderColor: '#FB8C00',
      '&:hover': {
        borderColor: '#F57C00',
      },
      boxShadow: 'none',
    }),
    option: (styles, { isSelected, isFocused }) => ({
      ...styles,
      backgroundColor: isSelected ? '#FF9800' : isFocused ? '#FFB74D' : 'transparent',
      color: isSelected ? 'white' : '#333',
      '&:active': {
        backgroundColor: '#FF7043',
      },
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: '#FFF3E0',
    }),
    placeholder: (styles) => ({
      ...styles,
      color: '#FB8C00',
    }),
    singleValue: (styles) => ({
      ...styles,
      color: '#FB8C00',
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-center mb-4">Update RNR Details</h2>

        {/* Form with react-hook-form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Property Code */}
          <div>
            <label htmlFor="selectedProperty" className="block text-sm font-medium text-gray-700">
              Property Code
            </label>
            <Controller
              name="selectedProperty"
              control={control}
              rules={{ required: "Please select a property" }} // Validation rule
              render={({ field }) => (
                <Select
                  {...field}
                  options={options}
                  placeholder="Select & Search a property"
                  className="mt-1 mb-4"
                  styles={customStyles}
                  id="selectedProperty"
                />
              )}
            />
            {errors.selectedProperty && (
              <p className="text-red-500 text-sm">{errors.selectedProperty.message}</p>
            )}
          </div>

          {/* Month */}
          <div>
            <label htmlFor="selectedMonth" className="block text-sm font-medium text-gray-700">
              Month
            </label>
            <Controller
              name="selectedMonth"
              control={control}
              rules={{ required: "Please select a month" }} // Validation rule
              render={({ field }) => (
                <Select
                  {...field}
                  options={options}
                  placeholder="Select & Search a month"
                  className="mt-1 mb-4"
                  styles={customStyles}
                  id="selectedMonth"
                />
              )}
            />
            {errors.selectedMonth && (
              <p className="text-red-500 text-sm">{errors.selectedMonth.message}</p>
            )}
          </div>

          {/* Button to trigger form submission */}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
           Update RNR Sheet
          </button>
        </form>

        {/* Display Loading Spinner */}
        {/* {isLoading && (
          <div className="flex justify-center items-center mt-4">
            <TailSpin color="#FB8C00" height={40} width={40} />
          </div>
        )} */}

        {/* Display Error Message */}
        {isError && (
          <div className="mt-4 text-center text-red-500">
            <p>Error: {error.message}</p>
          </div>
        )}

        {/* Display result */}
        {result !== null && (
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-green-600">
              Calculated Value: {result}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DueAmounts;
