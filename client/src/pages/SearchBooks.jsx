import React, { useEffect, useState } from 'react';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import Auth from '../utils/auth';
import { SAVE_BOOK, SEARCH_BOOKS } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';

const SearchBooks = () => {
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // const { loading, bookData } = useQuery(SEARCH_BOOKS, {
  //   variables: { query: searchInput }
  // })

  const [executeSearch, { data, loading, error }] = useLazyQuery(SEARCH_BOOKS, {
    fetchPolicy: 'no-cache'
  
  })
  useEffect(() => {
    if (data && data.searchBooks){
      setSearchedBooks(data.searchBooks);
    }
  },[data]) 

  const [saveBook] = useMutation(SAVE_BOOK, {
    update(cache, { data: { saveBook } }) {
      cache.modify({
        fields: {
          me(existingMeData) {
            const newBookRef = cache.writeFragment({
              data: saveBook,
              fragment: gql`
                fragment NewBook on User {
                  savedBooks
                }
              `,
            });
            return { ...existingMeData, savedBooks: newBookRef };
          },
        },
      });
    },
  });

  // This state is updated with the search results now, so initialize it here.
  const [searchedBooks, setSearchedBooks] = useState([]);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (!searchInput.trim()) return;
    console.log(searchInput);
    
    // setSearchedBooks(bookData.searchBooks);
    await executeSearch({ variables: { query: searchInput } });
    // console.log(data.searchBooks);
    
  };

const handleSaveBook = async (bookId) => {
  // Find the book in your searchedBooks state using the provided bookId
  const bookToSave = searchedBooks.find((book) => book.bookId === bookId);

  // Ensure the user is logged in
  const token = Auth.loggedIn() ? Auth.getToken() : null;
  if (!bookToSave || !token) {
    console.error('Not logged in, or book not found');
    return false;
  }

  const { __typename, ...bookDataForSave } = bookToSave;

  try {
    await saveBook({
      variables: { bookData: bookDataForSave },
    });

    // If the book save is successful, update the UI accordingly
    console.log('Book saved successfully!');
    // Optionally, add the bookId to savedBookIds state to update the UI
    setSavedBookIds([...savedBookIds, bookId]);
  } catch (error) {
    console.error('Error saving the book:', error);
  }
};

// if (data && data.searchBooks){
//   setSearchedBooks(data.searchBooks)
// }
  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name="searchInput"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type="text"
                  size="lg"
                  placeholder="Search for a book"
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type="submit" variant="success" size="lg">
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className="pt-5">
          {loading
            ? 'Loading...'
            : searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => (
            <Col md="4" key={book.bookId}>
              <Card border="dark">
                {book.image && (
                  <Card.Img
                    src={book.image}
                    alt={`The cover for ${book.title}`}
                    variant="top"
                  />
                )}
                <Card.Body>
                  <Card.Title>{book.title}</Card.Title>
                  <p className="small">Authors: {book.authors.join(', ')}</p>
                  <Card.Text>{book.description}</Card.Text>
                  {Auth.loggedIn() && (
                    <Button
                      disabled={savedBookIds.includes(book.bookId)}
                      className="btn-block btn-info"
                      onClick={() => handleSaveBook(book.bookId)}
                    >
                      {savedBookIds.includes(book.bookId)
                        ? 'This book has already been saved!'
                        : 'Save this Book!'}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;