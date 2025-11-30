import {
  CBadge,
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
import { coolGetFetch } from '../../lib/fetch'

const Dashboard = () => {
  const pageSize = 25
  const [page, setPage] = useState(0)
  const [params, setParams] = useSearchParams()
  const [node2Data, setNode2Data] = useState([])
  const [node2Count, setNode2Count] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageCount = Math.ceil(node2Count / pageSize)

  // Go to prev
  function goToPrevPage() {
    const p = parseInt(page)
    if (!isNaN(p) && p > 0) setPage(p - 1)
  }

  // Go to prev
  function goToNextPage() {
    const p = parseInt(page)
    if (!isNaN(p) && p < pageCount) setPage(p + 1)
  }

  // Fetch data on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    params.set('page', page)
    coolGetFetch(`http://localhost:4000/items?node=3&page=${page}&ps=${pageSize}`, setNode2Data)
      .then(() =>
        coolGetFetch(`http://localhost:4000/count?node=3`, ({ count }) => setNode2Count(count)),
      )
      .then(() => setLoading(false))
  }, [page])

  useEffect(() => {
    const page = params.get('page')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!page && page?.toString() !== '0') setPage(0)
    else setPage(page)
  }, [params])

  if (loading) return <>Loading...</>

  return (
    <>
      <div className="bg-black">
        <CBadge className="mb-1 mx-2">
          Page {page} of {pageCount - 1}
        </CBadge>
      </div>
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
          <CButton className="border-black border-opacity-50 my-2" onClick={() => goToPrevPage()}>
            Prev
          </CButton>
          <CFormInput
            className="my-2 mx-2"
            defaultValue={page}
            style={{
              width: '96px',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newPage = parseInt(e.currentTarget.value)
                if (!isNaN(newPage) && (!!newPage || newPage >= 0))
                  if (newPage < pageCount) setPage(newPage)
              }
            }}
          ></CFormInput>
          <CButton className="border-black border-opacity-50 my-2" onClick={() => goToNextPage()}>
            Next
          </CButton>
        </div>
      </CCard>
    </>
  )
}

export default Dashboard
