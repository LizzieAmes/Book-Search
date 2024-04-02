import { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME, REMOVE_BOOK } from '../utils/API';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';

const SavedBooks = () => {
  const { loading, error, data } = useQuery(GET_ME);

  // Define userData based on the data returned by the useQuery hook
  const userData = data?.me || {};

  const [removeBook] = useMutation(REMOVE_BOOK, {
    update(cache, { data: { removeBook: removedBook } }) {
      cache.modify({
        fields: {
          me(existingMeData) {
            const newSavedBooks = existingMeData.savedBooks.filter(
              (book) => book.bookId !== removedBook.bookId
            );
            return { ...existingMeData, savedBooks: newSavedBooks };
          },
        },
      });
    },
  });

  const handleDeleteBook = async (bookId) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;
    if (!token) {
      return false;
    }

    try {
      await removeBook({
        variables: { bookId },
      });
      removeBookId(bookId);
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  if (loading) return <h2>LOADING...</h2>;
  if (error) return <p>ERROR: {error.message}</p>;

  return (
    <>
      <div fluid className="text-light bg-dark p-5">
        <Container>
          <h1>Viewing saved books!</h1>
        </Container>
      </div>
      <Container>
        <h2 className="pt-5">
          {userData.savedBooks.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks.map((book) => {
            return (
              <Col md="4">
                <Card key={book.bookId} border="dark">
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant="top"
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className="small">Authors: {book.authors}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className="btn-block btn-danger"
                      onClick={() => handleDeleteBook(book.bookId)}
                    >
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
