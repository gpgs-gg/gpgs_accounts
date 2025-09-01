import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { useAddBooking, useFetchSingleSheetData, usePropertySheetData } from "./Server/index";

const DueAmounts = () => {
  const { control, watch, handleSubmit, formState: { errors } } = useForm();
  const [sheetId, setSheetId] = useState(null);
  const [result, setResult] = useState(null);
  const [rnrSheetData, setRnrSheetData] = useState({})
  console.log("rnrSheetData", rnrSheetData)
  // Fetch all properties
  const { data: fetchSingleSheetData, error, isError } = useFetchSingleSheetData();
  // Fetch property sheet data for selected property + month
  const { data: propertySheetData, isLoading, isSuccess } = usePropertySheetData(sheetId, !!sheetId);

  // Watch form values
  const selectedMonth = watch("selectedMonth");
  const selectedProperty = watch("selectedProperty");

  useEffect(() => {
    if (isSuccess && propertySheetData?.data) {
      // Build formula string like: "=123 + 456", skipping 0s
      const buildFormulaString = (values) => {
        const filtered = values
          .map(v => Number(v))
          .filter(v => !isNaN(v) && v > 0);

        return filtered.length > 0 ? `= ${filtered.join(" + ")}` : "";
      };

      // Extract names with due > 0, joined by newline
      const getNamesByDueCondition = (key) =>
        propertySheetData.data
          .filter(item => Number(item[key]) > 0)
          .map(item => item.FullName)
          .filter(name => name && name.trim() !== "")
          .join("\n"); // ⬅️ Changed from ", " to "\n"

      const ClientNameCurrentDue = getNamesByDueCondition("CurDueAmt");
      const ClientNameDepositDue = getNamesByDueCondition("DADue");
      const ClientNamePreviousDue = getNamesByDueCondition("PreDueAmt");

      // Build formulas
      const currentDue = buildFormulaString(propertySheetData.data.map(item => item.CurDueAmt));
      const daDue = buildFormulaString(propertySheetData.data.map(item => item.DADue));
      const preDue = buildFormulaString(propertySheetData.data.map(item => item.PreDueAmt));

      // Final object
      const transformed = [
        {
          PropertyCode: selectedProperty.label,
          ClientNameCurrentDue: ClientNameCurrentDue || "None",
          ClientNameDepositDue: ClientNameDepositDue || "None",
          ClientNamePreviousDue: ClientNamePreviousDue || "None",
          CurrentDue: currentDue,
          DepositDue: daDue,
          PreviousDue: preDue,
        }
      ];

      setRnrSheetData(transformed);
    }
  }, [isSuccess, propertySheetData]);


  const { mutate: submitBooking, isLoading: isBookingLoading } = useAddBooking();

  // When property is selected, build sheetId and fetch data automatically
  useEffect(() => {
    if (selectedMonth && selectedProperty) {
      const newSheetId = `${selectedProperty.value},${selectedMonth.value}`;
      setSheetId(newSheetId);

      // Example calculation
      const selectedData = fetchSingleSheetData?.data?.find(
        (item) => item["PG Main  Sheet ID"] === selectedProperty.value
      );

      if (selectedData) {
        const calculatedValue = selectedData["Bed Count"]
          ? parseInt(selectedData["Bed Count"]) * 2
          : 0;
        setResult(calculatedValue);
      }
    }
  }, [selectedMonth, selectedProperty, fetchSingleSheetData]);

  // Manual submit action
  const onSubmit = (data) => {
    submitBooking(
      {
        rnrSheetData: rnrSheetData[0],
        selectedMonth: selectedMonth?.value
      },
      {
        onSuccess: () => {
          alert("✅ Data successfully sent to Google Sheet!");
        }
      }
    );
  };

  // Property options
  const propertyOptions =
    fetchSingleSheetData?.data?.map((item) => ({
      value: item["PG Main  Sheet ID"],
      label: item["Property Code"],
    })) || [];


  // 🔐 Manual short month map to avoid "Sept" issue
  const MONTH_SHORT_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const today = new Date();

  const monthOptions = Array.from({ length: 2 }, (_, i) => {
    const baseDate = new Date(today.getFullYear(), today.getMonth() + i, 1);

    const year = baseDate.getFullYear();
    const monthIndex = baseDate.getMonth(); // 0 = Jan, 8 = Sep
    const shortMonth = MONTH_SHORT_NAMES[monthIndex]; // Always "Sep", never "Sept"
    const fullMonth = baseDate.toLocaleString("default", { month: "long" }); // e.g., "September"

    return {
      value: `${shortMonth}${year}`,   // ✅ Always "Sep2025"
      label: `${fullMonth} ${year}`    // e.g., "September 2025"
    };
  });


  // Custom styles
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      width: "100%",
      paddingTop: "0.25rem",
      paddingBottom: "0.10rem",
      paddingLeft: "0.75rem",
      paddingRight: "0.50rem",
      marginTop: "0.30rem",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: state.isFocused ? "#fb923c" : "#f97316",
      borderRadius: "0.375rem",
      boxShadow: state.isFocused
        ? "0 0 0 2px rgba(251,146,60,0.5)"
        : "0 1px 2px rgba(0,0,0,0.05)",
      backgroundColor: "white",
      minHeight: "40px",
      "&:hover": { borderColor: "#fb923c" },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: "#000",
      marginLeft: 0,
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#fb923c"
        : state.isFocused
          ? "rgba(251,146,60,0.1)"
          : "white",
      color: state.isSelected ? "white" : "#000",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#fb923c",
        color: "white",
      },
    }),
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-center mb-6 text-orange-600">
          Update RNR Details
        </h2>

        {/* Form wrapper for submit */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Month */}
          <div>
            <label className="text-sm font-medium text-gray-700 relative after:content-['*'] after:ml-1 after:text-red-500">
              Month
            </label>
            <Controller
              name="selectedMonth"
              control={control}
              rules={{ required: "Please select a month" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={monthOptions}
                  placeholder="Select a month"
                  styles={selectStyles}
                />
              )}
            />
            {errors.selectedMonth && (
              <p className="text-red-500 text-sm mt-1">
                {errors.selectedMonth.message}
              </p>
            )}
          </div>

          {/* Property */}
          <div className={`${!selectedMonth ? "cursor-not-allowed" : ""}`}>
            <label className="text-sm font-medium  text-gray-700 relative after:content-['*'] after:ml-1 after:text-red-500">
              Property Code
            </label>
            <Controller
              name="selectedProperty"
              control={control}
              rules={{ required: "Please select a property" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={propertyOptions}
                  placeholder="Select & Search a property"
                  styles={selectStyles}
                  isDisabled={!selectedMonth} // ✅ disable until month selected
                />
              )}
            />
            {errors.selectedProperty && (
              <p className="text-red-500 text-sm mt-1">
                {errors.selectedProperty.message}
              </p>
            )}
          </div>



          {sheetId && propertySheetData && rnrSheetData.length > 0 && (
            <div className="mt-2 mx-auto max-w-3xl bg-gray-50 text-black rounded-2xl shadow-lg p-6">
              {/* Heading */}
              <h2 className="text-2xl text-orange-300 font-bold text-center mb-6">
                Loaded Data
              </h2>
              <div></div>
              {/* Full Name Section */}
              <div>


                {/* Amounts in Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">

                  <div className="border-2 p-2 border-orange-200 ">
                    <div className="mb-2">
                      <span className="font-semibold text-orange-300">Client Names:</span>
                      <div className="mt-1 text-lg max-h-40 overflow-y-auto pr-2">
                        {rnrSheetData[0].ClientNameCurrentDue
                          ?.split('\n') // First, try splitting by newline
                          .map((name, index) => (
                            <p key={index}>{name.trim()}</p>
                          ))}
                      </div>
                    </div>

                    <div className="bg-gray-200 p-4 rounded-xl shadow">
                      <div className="mt-1 text-lg max-h-40 overflow-y-auto pr-2">

                      <p className="text-sm text-orange-400">Current Due Amount</p>
                      <p className="text-lg font-semibold">{rnrSheetData[0].CurrentDue || 0}</p>
                      </div>
                    </div>
                  </div>


                  <div className="border-2 p-2 border-orange-200">
                    <div className="mb-2">
                      <span className="font-semibold text-orange-500">Client Names:</span>
                        <div className="mt-1 text-lg max-h-40 overflow-y-auto pr-2">
                        {rnrSheetData[0].ClientNamePreviousDue
                          ?.split('\n') // First, try splitting by newline
                          .map((name, index) => (
                            <p key={index}>{name.trim()}</p>
                          ))}
                      </div>
                      {/* <p className="mt-1 text-lg">{rnrSheetData[0].ClientNamePreviousDue}</p> */}
                    </div>
                    <div className="bg-gray-200 p-4 rounded-xl shadow">
                      <p className="text-sm text-orange-500">Previous Due Amount</p>
                      <p className="text-lg font-semibold">{rnrSheetData[0].PreviousDue || 0}</p>
                    </div>
                  </div>


                  <div className=" border-2 p-2 border-orange-200">
                    <div className="mb-2">
                      <span className="font-semibold text-orange-500">Client Names:</span>
                       <div className="mt-1 text-lg max-h-40 overflow-y-auto pr-2">
                        {rnrSheetData[0].ClientNameDepositDue
                          ?.split('\n') // First, try splitting by newline
                          .map((name, index) => (
                            <p key={index}>{name.trim()}</p>
                          ))}
                      </div>
                    </div>
                    <div className="bg-gray-200 p-4 rounded-xl shadow">
                      <p className="text-sm text-orange-500">Deposit Due Amount</p>
                      <p className="text-lg font-semibold">{rnrSheetData[0].DepositDue || 0}</p>
                    </div>

                  </div>


                </div>

              </div>
            </div>
          )}
          {/* ✅ Submit Button */}
          <button
            type="submit"
            disabled={!isSuccess}
            className={`w-full px-4 py-2 ${!isSuccess ? "bg-orange-300" : "bg-orange-500"} text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-orange-400`}
          >
            {isLoading ? "Loading..." : "Update RNR Sheet"}
            {/* Update RNR Sheet */}
          </button>
        </form>

        {/* Error */}
        {isError && (
          <div className="mt-4 text-center text-red-500">
            <p>Error: {error.message}</p>
          </div>
        )}

        {/* Result */}

        {/* Property Sheet Data Debug */}


      </div>
    </div>
  );
};

export default DueAmounts;