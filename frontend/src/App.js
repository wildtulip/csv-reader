import './App.css';
import { useRef, useState, useEffect } from 'react'
import * as csv from "csvtojson"
import states from './states.json'
import moment from 'moment'
import { Modal, Table } from 'reactstrap';
import clsx from 'clsx';

function App() {
  const fileInput = useRef();
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isTableShow, setIsTableShow] = useState(false);
  const [modal, setModal] = useState(false);
  const toggleIncorrectData = () => setModal(!modal);

  const validate = (name, value, row) => {
    switch (name) {
      case 'age':
        return /^\d+$/.test(value) && value >= 21
      case 'experience':
        return value <= row.age.value && value >= 0
      case 'yearlyIncome':
        return value <= 1000000 && value >= 0
      case 'licenseStates':
        return value.split('|').every(name => states.find(el => el.name === name || el.abbreviation === name))
      case 'expirationDate':
        return moment(value.modelValue, ['YYYY-MM-DD', 'MM/DD/YYYY'], true).isValid() && moment(value).isAfter(new Date())
      case 'phone':
        return (value.startsWith('+1') && value.length === 12) || (value.startsWith('1') && value.length === 11) || (value.length === 10)
      case 'hasChildren':
        return value === 'TRUE' || value === 'FALSE' || value === ''
      case 'licenseNumber':
        return /^[0-9a-zA-Z]{6}$/.test(value)
      case 'email':
        return /^\S+@\S+.\S+$/.test(value)
      case 'fullName':
        return !!value
      default:
        break;
    }
  }

  useEffect(() => {
    const firstFiltration = data.map((el, i) => {
      return {
        fullName: { value: el["Full Name"].trim(), valid: '' },
        phone: { value: el["Phone"].trim().length === 10 ? '+1' + el["Phone"].trim().length : el["Phone"].trim().length === 11 ? '+' + el["Phone"].trim() : el["Phone"].trim(), valid: '' },
        email: { value: el["Email"].trim().toLowerCase(), valid: '' },
        age: { value: el["Age"].trim(), valid: '' },
        experience: { value: el["Expierence"].trim(), valid: '' },
        yearlyIncome: { value: Math.floor(Number(el["Yearly Income"].trim()) * 100) / 100, valid: '' },
        hasChildren: { value: el["Has children"].trim(), valid: '' },
        licenseStates: {
          value: el["License states"]
            .trim()
            .split('|')
            .map(el => {
              const state = states.find(el => el.name === el)
              return state ? state.abbreviation : el
            })
            .join('|'), valid: ''
        },
        expirationDate: { value: el["Expiration date"].trim(), valid: '' },
        licenseNumber: { value: el["License number"].trim(), valid: '' },
        id: { value: i + 1 },
        dublicateWith: { value: null }
      }
    }).map((row, i, self) => {
      Object.entries(row).forEach(([key, value]) => row[key].valid = validate(key, value.value, row))
      const dublicate = self.find(el => {
        return (row.phone.value === el.phone.value || row.email.value === el.email.value) && el.id.value !== row.id.value
      })
      row.dublicateWith.value = dublicate && dublicate.id.value
      return row
    })


    const isTableIncorrect = firstFiltration.find(el => {
      return el.phone.value === '' || el.email.value === '' || el.fullName.value === ''
    })
    isTableIncorrect ? setModal(true) : setIsTableShow(true);
    setTableData(firstFiltration);
    console.log(isTableShow);
  }, [data])

  const handleChange = () => {
    if (fileInput.current.files[0]) {
      const reader = new FileReader();
      reader.readAsText(fileInput.current.files[0], "UTF-8");
      reader.onload = function (loadedFile) {
        csv().fromString(loadedFile.target.result).then((parsedCSV) => {
          setData(parsedCSV)
        })
      }
    }
  }
  return (
    <div className="App">
      <input type="file" accept=".csv" ref={fileInput} onChange={handleChange}></input>

      {isTableShow ?
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Age</th>
              <th>Experience</th>
              <th>Yearly Income</th>
              <th>Has children</th>
              <th>License states</th>
              <th>Expiration date</th>
              <th>License number</th>
              <th>Dublicate with</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((el, i) => <tr key={i}>
              <th>{el.id.value}</th>
              <th className={clsx(el.fullName.valid ? 'green' : 'red')}>{el.fullName.value}</th>
              <th className={clsx(el.phone.valid ? 'green' : 'red')}>{el.phone.value}</th>
              <th className={clsx(el.email.valid ? 'green' : 'red')}>{el.email.value}</th>
              <th className={clsx(el.age.valid ? 'green' : 'red')}>{el.age.value}</th>
              <th className={clsx(el.experience.valid ? 'green' : 'red')}>{el.experience.value}</th>
              <th className={clsx(el.yearlyIncome.valid ? 'green' : 'red')}>{el.yearlyIncome.value}</th>
              <th className={clsx(el.hasChildren.valid ? 'green' : 'red')}>{el.hasChildren.value}</th>
              <th className={clsx(el.licenseStates.valid ? 'green' : 'red')}>{el.licenseStates.value}</th>
              <th className={clsx(el.expirationDate.valid ? 'green' : 'red')}>{el.expirationDate.value}</th>
              <th className={clsx(el.licenseNumber.valid ? 'green' : 'red')}>{el.licenseNumber.value}</th>
              <th>{el.dublicateWith.value}</th>
            </tr>)}
          </tbody>
        </Table> : <span>Upload CSV File!</span>}
      <Modal isOpen={modal} toggle={toggleIncorrectData}>
        Data is not correct!
      </Modal>
    </div>
  );
}

export default App;
