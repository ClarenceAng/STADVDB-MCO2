import {
  CButton,
  CCard,
  CFormInput,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMovie } from '@coreui/icons'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const Dashboard = () => {
  const [page, setPage] = useState(0)
  const [params, setParams] = useSearchParams()
  const [node2Data, setNode2Data] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch node 2 stuff
  async function fetchNode2Data() {
    try {
      const response = await fetch(`http://localhost:4000/items?node=2&page=${page}&ps=25`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setNode2Data(data)
      console.log(data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch failed:', err)
      setLoading(false)
    }
  }

  // Go to prev
  function goToPrevPage() {
    const p = parseInt(page)
    if (!isNaN(p) && p > 0) location.href = `/#/node2?page=${p - 1}`
  }

  // Go to prev
  function goToNextPage() {
    const p = parseInt(page)
    if (!isNaN(p) && p > 0) location.href = `/#/node2?page=${p + 1}`
  }

  // Fetch data on mount
  useEffect(() => {
    setLoading(true)
    fetchNode2Data()
  }, [page])

  useEffect(() => {
    const page = params.get('page')
    if (!page && page?.toString() !== '0') setPage(0)
    else setPage(page)
  }, [params])

  if (loading) return <>Loading...</>

  return (
    <>
      <CCard className="mb-4">
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell className="bg-body-tertiary text-center"></CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary px-4">Title and Type</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center">Genres</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center"></CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary"></CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {node2Data.map((item, index) => (
              <CTableRow v-for="item in tableItems" key={index}>
                <CTableHeaderCell className="bg-body-tertiary text-center">
                  <CIcon icon={cilMovie} />
                </CTableHeaderCell>
                <CTableDataCell>
                  <div className="px-4">
                    <div>{item.primaryTitle || item.originalTitle}</div>
                    <div className="small text-body-secondary text-nowrap">
                      <span>{item.titleType}</span>
                    </div>
                  </div>
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <div className="small text-body-secondary text-nowrap">
                    {[item.genre1, item.genre2, item.genre3].filter((g) => !!g).join(', ') || '—'}
                  </div>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
        <div
          className="flex gap-2"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <CButton className="border-black border-opacity-50 my-1" onClick={() => goToPrevPage()}>
            Prev
          </CButton>
          <CFormInput
            className="my-1 mx-2"
            value={page}
            style={{
              width: '96px',
            }}
            onChange={(e) => {
              const key = e.currentTarget.keyCode
              console.log(key)
            }}
          ></CFormInput>
          <CButton className="border-black border-opacity-50 my-1" onClick={() => goToNextPage()}>
            Next
          </CButton>
        </div>
      </CCard>
    </>
  )
}

export default Dashboard
