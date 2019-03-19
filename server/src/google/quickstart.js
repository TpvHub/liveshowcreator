const googleApi = require('./googleapi')

let q = `mimeType = 'application/vnd.google-apps.folder'
and appProperties has { key='documentId' and value='documentId1' } and trashed !=true`

// googleApi.listFiles(q).then(res => {
//   console.log(res)
// })
// .catch(er => {
//   console.log(er.message)
// })

// googleApi.createDocumentFolder('ABCDEF', {
//   documentId: 'documentId1'
// }).then(res => {
//   console.log(res)
// })

// googleApi.emptyTrash().then(res => {
//   console.log(res.data);
// })
// .catch(err => {
//   console.log(err.message)
// })

googleApi.deleteDocumentFolderById('1WY3H61Fq0hm4_Eq4WzD-Rd7wF0Ovhtqk').then(res => {
  console.log(res)
})
.catch(er => {
  console.log(er.message)
})

// googleApi.getDownloadUrl('1ehNIO1H1g7BZwh23LdUbJRwCl5UqZivx').then(res => {
//   console.log(res)
// })