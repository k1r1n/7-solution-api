import express from "express";
import axios from "axios";
import _ from "lodash";

const app = express();
const port = 3000;

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  age: number;
  hairColor: string;
  department: string;
  address: {
    city: string;
    state: string;
    postalCode: string;
  };
}

interface SummaryData {
  [key: string]: {
    male: number;
    female: number;
    ageRange: string;
    ageMode:
      | string
      | number
      | {
          city: string;
          state: string;
          postalCode: string;
        };
    hair: {
      [key: string]: number;
    };
    addressUser?: {
      [key: string]: string;
    };
  };
}

function modeBy<T>(array: T[], property: keyof T): T[keyof T] | undefined {
  const counts: { [key: string]: number } = {};
  let maxCount = 0;
  let mode: T[keyof T] | undefined;

  for (const item of array) {
    const value = item[property];
    counts[String(value)] = (counts[String(value)] || 0) + 1;

    if (counts[String(value)] > maxCount) {
      maxCount = counts[String(value)];
      mode = value;
    }
  }

  return mode;
}

app.get("/users", async (req, res) => {
  try {
    const response = await axios.get("https://dummyjson.com/users");
    const result = response.data.users as User[];
    const groupedUsers = _.groupBy(result, "company.department");
    const summaryData: SummaryData = {};

    for (const department in groupedUsers) {
      const departmentUsers = groupedUsers[department];

      const maleUsers = departmentUsers.filter(
        (user) => user.gender === "male"
      );
      const femaleUsers = departmentUsers.filter(
        (user) => user.gender === "female"
      );

      const ageRange = `${_.minBy(departmentUsers, "age")?.age}-${
        _.maxBy(departmentUsers, "age")?.age
      }`;
      const ageMode = modeBy(departmentUsers, "age") || 0;

      const hairColors = _.groupBy(departmentUsers, "hair.color");
      const hairSummary = _.mapValues(
        hairColors,
        (colorUsers) => colorUsers.length
      );

      const addressUsers = _.groupBy(
        departmentUsers,
        (user) => `${user.firstName}${user.lastName}`
      );
      const addressSummary = _.mapValues(
        addressUsers,
        (addressUsers) => addressUsers[0].address.postalCode
      );

      summaryData[department] = {
        male: maleUsers.length,
        female: femaleUsers.length,
        ageRange,
        ageMode,
        hair: hairSummary,
        addressUser: addressSummary,
      };
    }

    res.json(summaryData);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
