import {
  CBadge,
  CButton,
  CCard,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMovie, cilPen, cilPlus, cilSearch } from '@coreui/icons'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { coolGetFetch, coolPostFetch } from '../../lib/fetch'

const SERVER = import.meta.env.VITE_API_URL
const NODE = 3
const NodeGenres = [
  null,
  'Documentary',
  'Animation',
  'Short',
  'Romance',
  'Comedy',
  'News',
  'Drama',
  'Fantasy',
  'Horror',
  'Biography',
  'Music',
  'Crime',
  'Family',
  'Adventure',
  'Action',
  'History',
  'Mystery',
  'Musical',
  'War',
  'Sci-Fi',
  'Thriller',
  'Western',
  'Sport',
  'Film-Noir',
  'Talk-Show',
  'Game-Show',
  'Adult',
  'Reality-TV',
]

const Dashboard = () => {
  const pageSize = 25
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [params, setParams] = useSearchParams()
  const [nodeData, setNodeData] = useState([])
  const [nodeCount, setNodeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [insertModal, setInsertModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [reload, setReload] = useState([])
  const [selectedEntry, setSelectedEntry] = useState({})
  const pageCount = Math.ceil(nodeCount / pageSize)

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
    let dataUrl = `${SERVER}/items?node=${NODE}&page=${page}&ps=${pageSize}`
    let countUrl = `${SERVER}/count?node=${NODE}`
    if (!!search.trim()) {
      const kw = `&keywords=${search
        .split(' ')
        .map((s) => s.trim())
        .join(',')}`
      dataUrl += kw
      countUrl += kw
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    params.set('page', page)
    coolGetFetch(dataUrl, setNodeData)
      .then(() => coolGetFetch(countUrl, ({ count }) => setNodeCount(count)))
      .then(() => setLoading(false))
  }, [page, reload])

  useEffect(() => {
    const page = params.get('page')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!page && page?.toString() !== '0') setPage(0)
    else setPage(page)
  }, [params])

  if (loading) return <>Loading...</>

  return (
    <>
      <div style={{ display: 'flex', gap: '1em' }}>
        <div style={{ display: 'flex' }}>
          <CFormInput
            value={search}
            style={{
              width: '10em',
              borderRadius: '0.33em 0 0 0.33em',
              border: '1px solid rgba(0, 0, 0, 0.2)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && setReload([])}
            onChange={(e) => setSearch(e.currentTarget.value)}
          ></CFormInput>
          <CButton
            color="dark"
            style={{
              display: 'flex',
              borderRadius: '0 0.33em 0.33em 0',
              alignItems: 'center',
            }}
            onClick={() => setReload([])}
          >
            <CIcon icon={cilSearch}></CIcon>
          </CButton>
        </div>
        <CButton
          style={{
            borderRadius: '0.2em',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            background: 'rgba(0, 100, 200, 0.25)',
          }}
          onClick={() => setInsertModal(true)}
        >
          <CIcon icon={cilPlus}></CIcon>
          Insert Entry
        </CButton>
        <CModal visible={insertModal} onClose={() => setInsertModal(false)}>
          <InsertModal setState={setInsertModal} />
        </CModal>
        <CModal visible={editModal} onClose={() => setEditModal(false)}>
          <EditModal
            initialDraft={selectedEntry}
            selectedId={selectedEntry.titleID}
            setState={setEditModal}
          />
        </CModal>
      </div>
      <br />
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
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {nodeData.map((item, index) => (
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
                <CTableDataCell className="text-center">
                  <CButton
                    variant="ghost"
                    color="dark"
                    onClick={() => (setEditModal(true), setSelectedEntry(item))}
                  >
                    <CIcon icon={cilPen}></CIcon>
                  </CButton>
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
          <CButton color="dark" size="sm" className="my-2" onClick={() => goToPrevPage()}>
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
          <CButton color="dark" size="sm" className="my-2" onClick={() => goToNextPage()}>
            Next
          </CButton>
        </div>
      </CCard>
    </>
  )
}

const InsertModal = ({ setState }) => {
  const [entryDraft, setEntryDraft] = useState({
    titleType: 'movie',
    primaryTitle: '',
    isAdult: 0,
  })
  const setter = (key, value) => {
    setEntryDraft({
      ...entryDraft,
      [key]: value,
    })
  }

  return (
    <>
      <CModalHeader>
        <CModalTitle>Insert new entry</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div>
          <CBadge className="mb-1 mt-3" color="dark">
            Title Type
          </CBadge>
          <CFormSelect
            aria-label="titleType"
            value={entryDraft.titleType}
            onChange={(e) => setter('titleType', e.currentTarget.value)}
            options={[
              { label: 'movie', value: 'movie' },
              { label: 'short', value: 'short' },
              { label: 'video', value: 'video' },
              { label: 'video', value: 'videoGame' },
            ]}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Primary Title
          </CBadge>
          <CFormInput
            value={entryDraft.primaryTitle}
            onChange={(e) => setter('primaryTitle', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            Is Adult?
          </CBadge>
          <CFormSelect
            aria-label="isAdult"
            value={entryDraft.isAdult}
            onChange={(e) => setter('isAdult', e.currentTarget.value)}
            options={[
              { label: '0', value: '0' },
              { label: '1', value: '1' },
            ]}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Start Year
          </CBadge>
          <CFormInput
            type="number"
            value={entryDraft.startYear}
            onChange={(e) => setter('startYear', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            End Year
          </CBadge>
          <CFormInput
            type="number"
            value={entryDraft.endYear}
            onChange={(e) => setter('endYear', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 1
          </CBadge>
          <CFormSelect
            aria-label="genre1"
            value={entryDraft.genre1}
            onChange={(e) => setter('genre1', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 2
          </CBadge>
          <CFormSelect
            aria-label="genre2"
            value={entryDraft.genre2}
            onChange={(e) => setter('genre2', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 3
          </CBadge>
          <CFormSelect
            aria-label="genre3"
            value={entryDraft.genre3}
            onChange={(e) => setter('genre3', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="primary"
          onClick={() => {
            // Check if data is valid first
            if (!entryDraft?.primaryTitle?.trim()) {
              return alert('Primary title is required but missing')
            }
            if (!entryDraft?.titleType?.trim()) {
              return alert('Title type is required but missing')
            }
            coolPostFetch(
              `http://localhost:4000/create?node=${NODE}`,
              entryDraft,
              (v) => (console.log(v), alert('Succesfully inserted entry!'), setState(false)),
            ).catch((e) => (console.log(e), alert('Something went wrong...'), setState(false)))
          }}
        >
          Save changes
        </CButton>
      </CModalFooter>
    </>
  )
}

const EditModal = ({ initialDraft, selectedId, setState }) => {
  const [entryDraft, setEntryDraft] = useState(initialDraft)
  const setter = (key, value) => {
    setEntryDraft({
      ...entryDraft,
      [key]: value,
    })
  }

  return (
    <>
      <CModalHeader>
        <CModalTitle>Edit entry: {entryDraft.primaryTitle ?? 'No Title'}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <div>
          <CBadge className="mb-1 mt-3" color="dark">
            Title Type
          </CBadge>
          <CFormSelect
            aria-label="titleType"
            onChange={(e) => setter('titleType', e.currentTarget.value)}
            value={entryDraft?.titleType}
            options={[
              { label: 'movie', value: 'movie' },
              { label: 'short', value: 'short' },
              { label: 'video', value: 'video' },
              { label: 'video', value: 'videoGame' },
            ]}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Primary Title
          </CBadge>
          <CFormInput
            value={entryDraft?.primaryTitle}
            onChange={(e) => setter('primaryTitle', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            Is Adult?
          </CBadge>
          <CFormSelect
            aria-label="isAdult"
            value={entryDraft?.isAdult}
            onChange={(e) => setter('isAdult', e.currentTarget.value)}
            options={[
              { label: '0', value: '0' },
              { label: '1', value: '1' },
            ]}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Start Year
          </CBadge>
          <CFormInput
            type="number"
            value={entryDraft?.startYear}
            onChange={(e) => setter('startYear', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            End Year
          </CBadge>
          <CFormInput
            type="number"
            value={entryDraft?.endYear}
            onChange={(e) => setter('endYear', e.currentTarget.value)}
          ></CFormInput>

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 1
          </CBadge>
          <CFormSelect
            aria-label="genre1"
            value={entryDraft?.genre1}
            onChange={(e) => setter('genre1', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 2
          </CBadge>
          <CFormSelect
            aria-label="genre2"
            value={entryDraft?.genre2}
            onChange={(e) => setter('genre2', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />

          <CBadge className="mb-1 mt-3" color="dark">
            Genre 3
          </CBadge>
          <CFormSelect
            aria-label="genre3"
            value={entryDraft?.genre3}
            onChange={(e) => setter('genre3', e.currentTarget.value)}
            options={NodeGenres.map((ng) => ({ label: ng, value: ng }))}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="primary"
          onClick={() => {
            coolPostFetch(
              `http://localhost:4000/update?node=${NODE}&id=${selectedId}`,
              entryDraft,
              (v) => (console.log(v), alert('Succesfully updated entry!'), setState(false)),
            ).catch((e) => (console.log(e), alert('Something went wrong...'), setState(false)))
          }}
        >
          Save changes
        </CButton>
      </CModalFooter>
    </>
  )
}

export default Dashboard
